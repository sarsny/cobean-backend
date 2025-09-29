import { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } from '@coze/api';

// Coze服务配置接口
interface CozeConfig {
  apiKey: string;
  botId: string;
  baseUrl?: string;
}

// 自定义变量接口
interface CustomVariables {
  thought_content?: string;
  username?: string;
  user_preferences?: any;
  [key: string]: any;
}

export class CozeService {
  private config: CozeConfig;
  private client: CozeAPI;
  private conversations: Map<string, string> = new Map(); // userId -> conversationId

  constructor(config: CozeConfig) {
    this.config = config;
    
    // 初始化 Coze API 客户端
    this.client = new CozeAPI({
      token: config.apiKey,
      baseURL: config.baseUrl || COZE_CN_BASE_URL,
    });
  }

  /**
   * 获取配置信息（用于外部访问）
   */
  getConfig(): CozeConfig {
    return { ...this.config };
  }

  /**
   * 创建会话
   */
  async createConversation(userId: string): Promise<string> {
    // 检查是否已存在会话
    if (this.conversations.has(userId)) {
      return this.conversations.get(userId)!;
    }

    try {
      const conversation = await this.client.conversations.create({
        bot_id: this.config.botId,
      });

      const conversationId = conversation.id;
      this.conversations.set(userId, conversationId);
      return conversationId;
    } catch (error) {
      console.error('创建会话失败:', error);
      throw new Error('创建会话失败');
    }
  }

  /**
   * 发起对话 - 使用官方SDK的createAndPoll方法
   */
  async chat(userId: string, message: string, conversationId?: string, customVariables?: CustomVariables): Promise<any> {
    try {
      // 如果没有提供conversationId，则创建新会话
      if (!conversationId) {
        conversationId = await this.createConversation(userId);
      }

      const chatParams: any = {
        bot_id: this.config.botId,
        user_id: userId,
        auto_save_history: true,
        additional_messages: [
          {
            role: RoleType.User,
            content: message,
            content_type: 'text',
          },
        ],
        conversation_id: conversationId,
      };

      // 如果有自定义变量，添加到请求参数中
      if (customVariables && Object.keys(customVariables).length > 0) {
        chatParams.custom_variables = customVariables;
      }

      const chatResult = await this.client.chat.createAndPoll(chatParams);

      return {
        id: chatResult.chat.id,
        conversation_id: conversationId,
        status: chatResult.chat.status,
        messages: chatResult.messages,
      };
    } catch (error) {
      console.error('发起对话失败:', error);
      throw new Error('发起对话失败');
    }
  }

  /**
   * 轮询获取对话状态 - 使用官方SDK已经内置了轮询机制
   * 注意：官方SDK的createAndPoll已经包含了轮询功能，这个方法主要用于兼容性
   */
  async pollChatStatus(conversationId: string, chatId: string): Promise<any> {
    // 由于官方SDK的createAndPoll已经处理了轮询，这里返回一个模拟的完成状态
    return {
      id: chatId,
      conversation_id: conversationId,
      status: ChatStatus.COMPLETED,
    };
  }

  /**
   * 获取消息列表 - 官方SDK通过createAndPoll直接返回消息
   * 注意：官方SDK的createAndPoll已经返回了消息列表，这个方法主要用于兼容性
   */
  async getMessageList(conversationId: string, chatId: string): Promise<any[]> {
    // 由于官方SDK的createAndPoll已经返回消息，这里返回空数组
    // 实际消息应该从createAndPoll的结果中获取
    return [];
  }

  /**
   * 完整的对话流程
   */
  async completeChat(userId: string, message: string, conversationId?: string, customVariables?: CustomVariables): Promise<string> {
    try {
      const chatResult = await this.chat(userId, message, conversationId, customVariables);
      
      if (chatResult.status === ChatStatus.COMPLETED) {
        // 从消息中提取AI回复
        const aiMessages = chatResult.messages.filter((msg: any) => 
          msg.role === RoleType.Assistant && msg.type === 'answer'
        );
        
        if (aiMessages.length > 0) {
          return aiMessages[aiMessages.length - 1].content;
        }
      }
      
      throw new Error('AI回复获取失败');
    } catch (error) {
      console.error('完整对话流程失败:', error);
      throw new Error('AI回复获取失败');
    }
  }

  /**
   * 清除用户会话
   */
  clearConversation(userId: string): void {
    this.conversations.delete(userId);
  }

  /**
   * 获取用户会话ID
   */
  getConversationId(userId: string): string | undefined {
    return this.conversations.get(userId);
  }

  /**
   * 运行工作流
   */
  async runWorkflow(workflowId: string, parameters: any): Promise<any> {
    try {
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          parameters: parameters
        })
      });

      if (!response.ok) {
        throw new Error(`Workflow API request failed: ${response.status} ${response.statusText}`);
      }

      // 处理非流式响应
      const result = await response.json();
      
      console.log('Workflow result:', result);
      return result;

    } catch (error) {
      console.error('Error running workflow:', error);
      throw error;
    }
  }
}

// 单例模式
let cozeServiceInstance: CozeService | null = null;

export const initCozeService = (config: CozeConfig): CozeService => {
  cozeServiceInstance = new CozeService(config);
  return cozeServiceInstance;
};

export const getCozeService = (): CozeService => {
  if (!cozeServiceInstance) {
    throw new Error('CozeService 未初始化，请先调用 initCozeService');
  }
  return cozeServiceInstance;
};