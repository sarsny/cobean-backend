import { Request, Response } from 'express';
import { ThoughtModel, ActionModel, UserChoiceModel, UserPreferenceModel, ChatModel, ChatMessageModel } from '../models';
import { CreateThoughtRequest, ApiResponse, Thought, Chat } from '../types';
import { getCozeService } from '../services/cozeService';

export const createThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const thoughtData: CreateThoughtRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!thoughtData.title || !thoughtData.description) {
      res.status(400).json({
        success: false,
        error: 'Title and description are required'
      } as ApiResponse);
      return;
    }

    // For SAT tokens, allow specifying user_id in request body
    // For regular JWT tokens, always use the authenticated user's ID
    const finalUserId = (req.user?.type === 'service_account' && thoughtData.user_id) 
      ? thoughtData.user_id 
      : userId;

    // Add user_id to the thought data and set defaults for new fields
    const thoughtWithUserId = {
      ...thoughtData,
      user_id: finalUserId,
      is_public: thoughtData.is_public ?? false,
      is_collaborative: thoughtData.is_collaborative ?? false,
      tags: thoughtData.tags ?? []
    };

    const thought = await ThoughtModel.create(thoughtWithUserId);

    res.status(201).json({
      success: true,
      data: thought
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating thought:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      error: 'Failed to create thought',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const thought = await ThoughtModel.findById(id);

    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    // Check if thought belongs to user or if using SAT token
    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: thought
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching thought:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thought'
    } as ApiResponse);
  }
};

export const getThoughts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // 获取用户的所有想法，并包含关联的会话信息
    const thoughtsWithConversations = await ThoughtModel.findByUserIdWithConversations(userId);

    res.json({
      success: true,
      data: thoughtsWithConversations
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching thoughts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thoughts'
    } as ApiResponse);
  }
};

export const getThoughtContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Get the thought
    const thought = await ThoughtModel.findById(id);

    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    // Check if thought belongs to user or if using SAT token
    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Get current actions for the thought
    const currentActions = await ActionModel.findCurrentByThoughtId(id);

    // Get choices for the thought
    const choices = await UserChoiceModel.findByThoughtId(id);

    // Get user preferences
    const preferences = await UserPreferenceModel.findByUserId(userId);

    const context = {
      thought,
      current_actions: currentActions,
      choices,
      preferences
    };

    res.json({
      success: true,
      data: context
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching thought context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thought context'
    } as ApiResponse);
  }
};

export const updateThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if thought belongs to user or if using SAT token
    const belongsToUser = await ThoughtModel.belongsToUser(id, userId);
    if (!belongsToUser && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const thought = await ThoughtModel.update(id, updates);

    res.json({
      success: true,
      data: thought
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating thought:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thought'
    } as ApiResponse);
  }
};

export const getPublicThoughts = async (req: Request, res: Response): Promise<void> => {
  try {
    const thoughts = await ThoughtModel.findPublicThoughts();

    res.json({
      success: true,
      data: thoughts
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching public thoughts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public thoughts'
    } as ApiResponse);
  }
};

export const deleteThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if thought belongs to user or if using SAT token
    const belongsToUser = await ThoughtModel.belongsToUser(id, userId);
    if (!belongsToUser && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    await ThoughtModel.delete(id);

    res.json({
      success: true,
      message: 'Thought deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting thought:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete thought'
    } as ApiResponse);
  }
};

// 新增接口：获取thought和关联的conversation数据
export const getThoughtWithConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // 1. 查询thought数据
    const thought = await ThoughtModel.findById(id);

    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    // 检查权限：thought是否属于当前用户或使用SAT token
    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // 2. 查询关联的conversation数据
    let conversation: Chat | null = null;
    try {
      conversation = await ChatModel.findByThoughtAndUser(id, thought.user_id);
    } catch (error) {
      // 如果没有找到conversation，不抛出错误，继续返回thought数据
      console.log('No conversation found for thought:', id);
    }

    // 3. 构建返回数据
    const responseData: {
      thought: Thought;
      conversation?: Chat;
      hasConversation: boolean;
    } = {
      thought,
      hasConversation: !!conversation
    };

    if (conversation) {
      responseData.conversation = conversation;
    }

    res.json({
      success: true,
      data: responseData
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching thought with conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thought with conversation'
    } as ApiResponse);
  }
};

export const updateThoughtStageToInProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // 检查想法是否存在
    const thought = await ThoughtModel.findById(id);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    // 检查权限：想法是否属于当前用户或使用SAT token
    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // 更新想法状态为 in_progress
    const updatedThought = await ThoughtModel.update(id, { 
      stage: 'in_progress'
    });

    res.json({
      success: true,
      data: updatedThought
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating thought stage to in_progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thought stage'
    } as ApiResponse);
  }
};

// 新增接口：创建thought并自动创建conversation和发送初始消息
export const createThoughtWithConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const thoughtData: CreateThoughtRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!thoughtData.title || !thoughtData.description) {
      res.status(400).json({
        success: false,
        error: 'Title and description are required'
      } as ApiResponse);
      return;
    }

    // For SAT tokens, allow specifying user_id in request body
    // For regular JWT tokens, always use the authenticated user's ID
    const finalUserId = (req.user?.type === 'service_account' && thoughtData.user_id) 
      ? thoughtData.user_id 
      : userId;

    // 1. 创建thought记录
    const thoughtWithUserId = {
      ...thoughtData,
      user_id: finalUserId,
      is_public: thoughtData.is_public ?? false,
      is_collaborative: thoughtData.is_collaborative ?? false,
      tags: thoughtData.tags ?? []
    };

    const thought = await ThoughtModel.create(thoughtWithUserId);

    // 2. 创建关联的conversation
    const conversationData = {
      thought_id: thought.id,
      bean_id: '11111111-2222-3333-4444-555555555555', // 使用数据库中存在的bean ID
      user_id: finalUserId,
      conversation_type: 'thought' as const
    };

    const conversation = await ChatModel.create(conversationData);

    // 3. 自动发送初始消息给coze
    try {
      const cozeService = getCozeService();
      const initialMessage = `hey，cobean，我有个新想法{{thoughtTitle}}`;
      
      // 创建用户消息记录
      const userMessage = await ChatMessageModel.create({
        conversation_id: conversation.id,
        sender: 'user',
        content: initialMessage.replace('{{thoughtTitle}}', thought.title),
        metadata: { auto_generated: true, type: 'initial_message' }
      });

      // 发送消息给coze并获取回复
      const customVariables = {
        thoughtTitle: thought.title,
        thought_content: thought.description || thought.title
      };

      let aiResponseText: string;
      try {
        // 创建coze会话并发送消息
        const cozeConversationId = await cozeService.createConversation(finalUserId);
        const messageToSend = initialMessage.replace('{{thoughtTitle}}', thought.title);
        aiResponseText = await cozeService.completeChat(finalUserId, messageToSend, cozeConversationId, customVariables);
        
        // 更新conversation记录，保存coze会话ID
        await ChatModel.update(conversation.id, { coze_conversation_id: cozeConversationId });
      } catch (cozeError) {
        console.error('Error getting AI response:', cozeError);
        aiResponseText = 'Hello! I received your new idea. Let me think about it and get back to you.';
      }

      // 4. 将coze的回复添加到conversation的message中
      const aiMessage = await ChatMessageModel.create({
        conversation_id: conversation.id,
        sender: 'bean',
        content: aiResponseText,
        metadata: { generated_by: 'coze_service', type: 'initial_response' }
      });

      // 更新conversation的updated_at时间戳
      await ChatModel.update(conversation.id, { updated_at: new Date().toISOString() });

      res.status(201).json({
        success: true,
        data: thought
      } as ApiResponse);

    } catch (messageError) {
      console.error('Error handling initial message exchange:', messageError);
      
      // 即使消息发送失败，也返回创建的thought
      res.status(201).json({
        success: true,
        data: thought
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Error creating thought with conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create thought with conversation'
    } as ApiResponse);
  }
};