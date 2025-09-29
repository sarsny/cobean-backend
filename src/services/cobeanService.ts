import { getCozeService } from './cozeService';
import { ThoughtModel, ActionHistoryModel, UserPreferenceModel, ActionModel, ChatModel, ChatMessageModel } from '../models';
import { Action, Chat } from '../types';

export class CobeanService {
  /**
   * 构建工作流输入数据
   * @param thoughtId - 思考ID
   * @param userId - 用户ID
   * @returns Promise<工作流输入数据>
   */
  private async buildWorkflowInput(thoughtId: string, userId: string): Promise<{
    bean_info: string;
    historical_actions: any[];
    thought_title: string;
    user_preferences: any;
  }> {
    try {
      console.log(`[CobeanService] 构建工作流输入数据 - thoughtId: ${thoughtId}, userId: ${userId}`);

      // 获取思考信息
      const thought = await ThoughtModel.findById(thoughtId);
      if (!thought) {
        throw new Error(`思考不存在: ${thoughtId}`);
      }

      // 获取历史行动数据 - 先获取该思考的所有行动，再获取对应的历史记录
      const actions = await ActionModel.findByThoughtId(thoughtId);
      let historicalActions: any[] = [];
      
      for (const action of actions) {
        const actionHistoryRecords = await ActionHistoryModel.findByActionId(action.id);
        historicalActions = historicalActions.concat(
          actionHistoryRecords.map(history => ({
            id: history.id,
            action_id: history.action_id,
            final_status: history.final_status,
            notes: history.notes || '行动记录'
          }))
        );
      }

      // 获取用户偏好
      const userPreferences = await UserPreferenceModel.findByUserId(userId);
      const preferencesObj = userPreferences.reduce((acc, pref) => {
        acc[pref.preference_key] = pref.score;
        return acc;
      }, {} as any);

      // 构建工作流输入
      const workflowInput = {
        bean_info: thought.description || thought.title || '用户思考',
        historical_actions: historicalActions,
        thought_title: thought.title || '用户思考',
        user_preferences: preferencesObj
      };

      console.log(`[CobeanService] 工作流输入数据构建完成:`, {
        bean_info: workflowInput.bean_info.substring(0, 50) + '...',
        historical_actions_count: workflowInput.historical_actions.length,
        thought_title: workflowInput.thought_title,
        user_preferences_keys: Object.keys(workflowInput.user_preferences)
      });

      return workflowInput;

    } catch (error) {
      console.error('[CobeanService] 构建工作流输入数据失败:', error);
      throw new Error(`构建工作流输入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 分析用户思考和行为，主动生成 Cobean 的行为
   * 并模拟 Cobean 将自己的行为通过聊天告诉用户
   * @param thoughtId - 思考ID
   * @param userId - 用户ID
   * @returns Promise<{ actions: Action[], chats: Chat[] }>
   */
  async analyzeUserThoughtAndActions(thoughtId: string, userId: string): Promise<{ actions: Action[], chats: Chat[] }> {
    try {
      console.log(`[CobeanService] 开始分析用户思考和行为 - thoughtId: ${thoughtId}, userId: ${userId}`);
      
      // 从数据库获取完整数据
      const workflowInput = await this.buildWorkflowInput(thoughtId, userId);
      
      // 获取 CozeService 实例
      const cozeService = getCozeService();
      
      // 调用 Coze 工作流来分析用户思考和行为
      const workflowResult = await cozeService.runWorkflow('7555041516772605991', workflowInput);
      
      if (!workflowResult || !workflowResult.data) {
        console.log('[CobeanService] 工作流返回空结果');
        return { actions: [], chats: [] };
      }

      // 解析 JSON 字符串数据
      let parsedData;
      try {
        parsedData = typeof workflowResult.data === 'string' 
          ? JSON.parse(workflowResult.data) 
          : workflowResult.data;
      } catch (error) {
        console.error('[CobeanService] 解析工作流数据失败:', error);
        console.log('[CobeanService] 原始数据:', workflowResult.data);
        return { actions: [], chats: [] };
      }

      const { actions: actionData, chats: chatData } = parsedData;
      console.log(`[CobeanService] 工作流返回 ${actionData?.length || 0} 个行为和 ${chatData?.length || 0} 个聊天`);

      // 处理 actions
      const actions: Action[] = [];
      if (actionData && Array.isArray(actionData)) {
        for (const actionItem of actionData) {
          try {
            // 验证并规范化 Action type
            const validActionTypes = [
              'Event', 'Knowledge', 'Decision', 'Reflection', 'Task', 'Exploration',
              'Social', 'Reward/Achievement', 'Challenge', 'Random Event', 
              'Mood/Status', 'Idea/Insight', 'Resource/Tool', 'Interactive Task'
            ];
            const actionType = validActionTypes.includes(actionItem.type) ? actionItem.type : 'Event';
            
            if (actionItem.type && !validActionTypes.includes(actionItem.type)) {
              console.warn(`[CobeanService] 无效的Action类型: ${actionItem.type}，使用默认值: Event`);
            }

            const action = await ActionModel.create({
              thought_id: thoughtId,
              bean_id: actionItem.bean_id || '11111111-2222-3333-4444-555555555555', // 使用现有的 Bean UUID
              type: actionType,
              summary: actionItem.summary || actionItem.title || '',
              event: actionItem.event || actionItem.description || '',
              knowledge: actionItem.knowledge || '',
              decision: actionItem.decision || '',
              reflection: actionItem.reflection || ''
            });
            
            actions.push(action);
            console.log(`[CobeanService] 保存行为: ${action.summary}`);
          } catch (error) {
            console.error('[CobeanService] 保存行为失败:', error);
          }
        }
      }

      // 处理 chats - 将聊天记录插入到execution类型的conversation中
      const chats: Chat[] = [];
      const chatSource = chatData;
      
      if (chatSource && Array.isArray(chatSource)) {
        // 首先查找或创建execution类型的conversation
        let executionConversation = await ChatModel.findByThoughtUserAndType(thoughtId, userId, 'execution');
        
        if (!executionConversation) {
          // 如果不存在execution类型的conversation，创建一个
          executionConversation = await ChatModel.create({
            thought_id: thoughtId,
            bean_id: '11111111-2222-3333-4444-555555555555', // 使用现有的 Bean UUID
            user_id: userId,
            agent_type: 'cobean',
            conversation_type: 'execution'
          });
          console.log(`[CobeanService] 创建execution类型对话: ${executionConversation.id}`);
        }

        // 将每条聊天记录作为消息插入到execution conversation中
        for (const chatItem of chatSource) {
          try {
            const chatContent = typeof chatItem === 'string' ? chatItem : chatItem.content || JSON.stringify(chatItem);
            
            // 创建聊天消息并插入到execution conversation中
            const message = await ChatMessageModel.create({
              conversation_id: executionConversation.id,
              sender: 'bean', // 假设这些是AI生成的消息
              content: chatContent,
              metadata: {
                source: 'workflow_analysis',
                thought_id: thoughtId,
                original_data: typeof chatItem === 'object' ? chatItem : undefined
              }
            });
            
            console.log(`[CobeanService] 插入聊天消息到execution对话: ${message.id}`);
          } catch (error) {
            console.error('[CobeanService] 插入聊天消息失败:', error);
          }
        }
        
        chats.push(executionConversation);
      }

      console.log(`[CobeanService] 成功处理 ${actions.length} 个行为和 ${chats.length} 个聊天消息`);
      return { actions, chats };

    } catch (error) {
      console.error('[CobeanService] 分析用户思考和行为失败:', error);
      throw new Error(`分析用户思考和行为失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成 Cobean 的主动建议
   * @param thoughtId - 思考ID
   * @param userId - 用户ID
   * @param context - 上下文信息
   * @returns Promise<Chat[]>
   */
  async generateProactiveSuggestions(thoughtId: string, userId: string, context?: any): Promise<Chat[]> {
    try {
      console.log(`[CobeanService] 生成主动建议 - thoughtId: ${thoughtId}, userId: ${userId}`);
      
      // 这里可以根据上下文生成更智能的建议
      // 暂时返回空数组，后续可以扩展
      return [];
      
    } catch (error) {
      console.error('[CobeanService] 生成主动建议失败:', error);
      throw new Error(`生成主动建议失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 手动工作流分析（用于测试和手动触发）
   * @param workflowInput - 工作流输入数据
   * @returns Promise<{ actions: Action[], chats: Chat[] }>
   */
  async manualWorkflowAnalysis(workflowInput: {
    bean_info: string;
    historical_actions: any[];
    thought_title: string;
    user_preferences: any;
  }): Promise<{ actions: Action[], chats: Chat[] }> {
    try {
      console.log(`[CobeanService] 开始手动工作流分析`);
      console.log('工作流输入数据:', workflowInput);
      
      // 获取 CozeService 实例
      const cozeService = getCozeService();
      
      // 调用 Coze 工作流，传递完整的用户输入数据
      const workflowResult = await cozeService.runWorkflow('7555041516772605991', workflowInput);
      
      if (!workflowResult || !workflowResult.data) {
        console.log('[CobeanService] 手动工作流返回空结果');
        return { actions: [], chats: [] };
      }

      const { actions: actionData, chats: chatData } = workflowResult.data;
      console.log(`[CobeanService] 手动工作流返回 ${actionData?.length || 0} 个行为和 ${chatData?.length || 0} 个聊天`);

      // 处理 actions（手动模式不保存到数据库，直接返回）
      const actions: Action[] = [];
      if (actionData && Array.isArray(actionData)) {
        for (const actionItem of actionData) {
          // 验证并规范化 Action type
          const validActionTypes = [
            'Event', 'Knowledge', 'Decision', 'Reflection', 'Task', 'Exploration',
            'Social', 'Reward/Achievement', 'Challenge', 'Random Event', 
            'Mood/Status', 'Idea/Insight', 'Resource/Tool', 'Interactive Task'
          ];
          const actionType = validActionTypes.includes(actionItem.type) ? actionItem.type : 'Event';
          
          if (actionItem.type && !validActionTypes.includes(actionItem.type)) {
            console.warn(`[CobeanService] 手动模式 - 无效的Action类型: ${actionItem.type}，使用默认值: Event`);
          }

          const action = {
            id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            thought_id: 'manual-test',
            bean_id: actionItem.bean_id || '11111111-2222-3333-4444-555555555555', // 使用现有的 Bean UUID
            type: actionType,
            summary: actionItem.summary || actionItem.title || '',
            event: actionItem.event || actionItem.description || '',
            knowledge: actionItem.knowledge || '',
            decision: actionItem.decision || '',
            reflection: actionItem.reflection || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Action;
          
          actions.push(action);
          console.log(`[CobeanService] 处理手动行为: ${action.summary}`);
        }
      }

      // 处理 chats（手动模式不保存到数据库，直接返回）
      const chats: Chat[] = [];
      if (chatData && Array.isArray(chatData)) {
        for (const chatItem of chatData) {
          const chat = {
            id: `manual-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            thought_id: 'manual-test',
            bean_id: chatItem.bean_id || '11111111-2222-3333-4444-555555555555', // 使用现有的 Bean UUID
            user_id: 'test-user',
            external_conversation_id: chatItem.external_conversation_id,
            agent_type: chatItem.agent_type || 'cobean',
            coze_conversation_id: chatItem.coze_conversation_id,
            conversation_type: chatItem.conversation_type || 'thought',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Chat;
          
          chats.push(chat);
          console.log(`[CobeanService] 处理手动聊天会话: ${chat.id}`);
        }
      }

      console.log(`[CobeanService] 手动工作流分析完成，处理了 ${actions.length} 个行为和 ${chats.length} 个聊天消息`);
      return { actions, chats };

    } catch (error) {
      console.error('[CobeanService] 手动工作流分析失败:', error);
      throw new Error(`手动工作流分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 模拟 Cobean 的行为反馈
   * @param actions - 行为列表
   * @param thoughtId - 思考ID
   * @param userId - 用户ID
   * @returns Promise<Chat[]>
   */
  async simulateCobeanBehaviorFeedback(actions: Action[], thoughtId: string, userId: string): Promise<Chat[]> {
    try {
      console.log(`[CobeanService] 模拟 Cobean 行为反馈 - ${actions.length} 个行为`);
      
      const chats: Chat[] = [];
      
      for (const action of actions) {
        // 根据行为类型生成不同的反馈消息
        let feedbackContent = '';
        
        switch (action.type) {
          case 'Event':
            feedbackContent = `我为你的想法记录了一个事件："${action.summary}"，这将帮助你跟踪进展。`;
            break;
          case 'Exploration':
            feedbackContent = `我为你的想法进行了探索分析："${action.summary}"，发现了一些有趣的方向。`;
            break;
          case 'Decision':
            feedbackContent = `我帮你分析了决策要点："${action.summary}"，这可以指导你的下一步行动。`;
            break;
          case 'Reflection':
            feedbackContent = `我对你的想法进行了反思："${action.summary}"，希望能给你新的启发。`;
            break;
          case 'Task':
            feedbackContent = `我记录了你的进展："${action.summary}"，继续保持这个节奏！`;
            break;
          default:
            feedbackContent = `我为你的想法创建了一个行动项："${action.summary}"`;
        }

        const chat = await ChatModel.create({
          thought_id: thoughtId,
          bean_id: '11111111-2222-3333-4444-555555555555', // 使用现有的 Bean UUID
          user_id: userId,
          agent_type: 'cobean',
          conversation_type: 'thought'
        });

        chats.push(chat);
      }

      console.log(`[CobeanService] 生成了 ${chats.length} 条行为反馈消息`);
      return chats;

    } catch (error) {
      console.error('[CobeanService] 模拟行为反馈失败:', error);
      throw new Error(`模拟行为反馈失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}