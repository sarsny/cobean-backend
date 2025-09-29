import { Request, Response } from 'express';
import { ChatModel, ChatMessageModel, ActionModel, ActionHistoryModel, UserChoiceModel, ThoughtModel, UserPreferenceModel } from '../models';
import { 
  CreateChatRequest, 
  CreateChatResponse, 
  SendMessageRequest, 
  SendMessageResponse,
  GetChatMessagesResponse,
  ApiResponse,
  Chat,
  ChatMessage
} from '../types';
import { getCozeService } from '../services/cozeService';
import { info } from 'console';

export const createChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatData: CreateChatRequest = req.body;
    const userId = req.user?.id;
    console.info('createChat:', chatData);
    console.info('userId:', userId);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!chatData.thought_id || !chatData.bean_id) {
      res.status(400).json({
        success: false,
        error: 'Thought ID and Bean ID are required'
      } as ApiResponse);
      return;
    }

    // Check if thought exists and belongs to user
    const thought = await ThoughtModel.findById(chatData.thought_id);
    console.info('Found thought:', thought);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    if (thought.user_id !== userId) {
      console.info('Access denied - thought.user_id:', thought.user_id, 'userId:', userId);
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Check if conversation already exists for this thought and user
    const existingChat = await ChatModel.findByThoughtAndUser(chatData.thought_id, userId);
    console.info('Existing chat:', existingChat);
    if (existingChat) {
      res.status(200).json({
        success: true,
        data: existingChat
      } as ApiResponse<CreateChatResponse>);
      return;
    }

    // Create new conversation
    let cozeConversationId: string | undefined;
    try {
      const cozeService = getCozeService();
      cozeConversationId = await cozeService.createConversation(userId);
      console.info('Created Coze conversation:', cozeConversationId);
    } catch (cozeError) {
      console.error('Error creating Coze conversation:', cozeError);
      // Continue without Coze conversation ID - will be handled in sendMessage
    }

    // Create chat with thought type (default)
    const chat = await ChatModel.create({
      ...chatData,
      user_id: userId,
      conversation_type: chatData.conversation_type || 'thought'
    });
    console.info('Created chat:', chat);

    res.status(201).json({
      success: true,
      data: chat
    } as ApiResponse<CreateChatResponse>);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    } as ApiResponse);
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const messageData: SendMessageRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!messageData.conversation_id || !messageData.content) {
      res.status(400).json({
        success: false,
        error: 'Conversation ID and content are required'
      } as ApiResponse);
      return;
    }

    // Check if conversation exists and belongs to user
    const chat = await ChatModel.findById(messageData.conversation_id);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Create user message
    const userMessage = await ChatMessageModel.create({
      conversation_id: messageData.conversation_id,
      sender: messageData.sender || 'user',
      content: messageData.content,
      metadata: messageData.metadata
    });

    // Get AI response from Coze
    let aiResponseText = '';
    try {
      const cozeService = getCozeService();
      // Use the existing Coze conversation ID if available
      const cozeConversationId = chat.coze_conversation_id;
      if (cozeConversationId) {
        aiResponseText = await cozeService.completeChat(userId, messageData.content, cozeConversationId);
      } else {
        // Fallback: create a new conversation if not exists
        const newCozeConversationId = await cozeService.createConversation(userId);
        aiResponseText = await cozeService.completeChat(userId, messageData.content, newCozeConversationId);
        
        // Update the chat record with the new Coze conversation ID
        await ChatModel.update(chat.id, { coze_conversation_id: newCozeConversationId });
      }
    } catch (cozeError) {
      console.error('Error getting AI response:', cozeError);
      aiResponseText = 'Sorry, I encountered an error while processing your message. Please try again.';
    }

    // Create AI message
    const aiMessage = await ChatMessageModel.create({
      conversation_id: messageData.conversation_id,
      sender: 'bean',
      content: aiResponseText,
      metadata: { generated_by: 'coze_service' }
    });

    // Update conversation's updated_at timestamp
    await ChatModel.update(chat.id, { updated_at: new Date().toISOString() });

    res.status(200).json({
      success: true,
      data: {
        user_message: userMessage,
        ai_message: aiMessage
      }
    } as ApiResponse<SendMessageResponse>);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    } as ApiResponse);
  }
};

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if conversation exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Get messages for the conversation
    const messages = await ChatMessageModel.findByConversationIdWithPagination(
      chatId,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      data: {
        messages
      }
    } as ApiResponse<GetChatMessagesResponse>);
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat messages'
    } as ApiResponse);
  }
};

export const getUserChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const chats = await ChatModel.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: chats
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user conversations'
    } as ApiResponse);
  }
};

export const getChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: chat
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    } as ApiResponse);
  }
};

export const sendMessageWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { content, thought_id }: SendMessageRequest & { thought_id: string } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!content || !thought_id) {
      res.status(400).json({
        success: false,
        error: 'Content and thought_id are required'
      } as ApiResponse);
      return;
    }

    // 检查是否为mock模式
    const isMockMode = (req as any).mockMode || chatId.startsWith('mock-');
    
    if (isMockMode) {
      // Mock模式：创建模拟响应
      const userMessage = {
        id: `mock-msg-${Date.now()}-user`,
        conversation_id: chatId,
        sender: 'user' as const,
        content: content,
        metadata: {
          thought_id: thought_id,
          has_context: true,
          bot_id: '7553108566920626185' // 标记使用的专用bot_id
        },
        created_at: new Date().toISOString()
      };

      const aiMessage = {
        id: `mock-msg-${Date.now()}-ai`,
        conversation_id: chatId,
        sender: 'bean' as const,
        content: `我收到了你的消息："${content}"，并且注意到与此想法 ${thought_id} 相关。我是专门为chatWithAction接口配置的AI助手（bot_id: 7553108566920626185），专门处理带有想法上下文的对话。这是一个模拟回复，展示了专用bot的对话功能。`,
        metadata: {
          bot_id: '7553108566920626185'
        },
        created_at: new Date().toISOString()
      };

      const response: SendMessageResponse = {
        user_message: userMessage,
        ai_message: aiMessage
      };

      res.status(201).json({
        success: true,
        data: response
      } as ApiResponse);
      return;
    }

    // 正常模式：执行原有逻辑
    // Check if conversation exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Verify the thought exists and belongs to the user
    const thought = await ThoughtModel.findById(thought_id);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    if (thought.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to thought'
      } as ApiResponse);
      return;
    }

    // Build context from thought-related data
    const actions = await ActionModel.findByThoughtId(thought_id);
    const actionHistory = await ActionHistoryModel.findByThoughtId(thought_id);
    const userChoices = await UserChoiceModel.findByThoughtId(thought_id);

    // Create context string
    let contextString = `\n\n--- 相关上下文 ---\n`;
    contextString += `想法: ${thought.title}\n`;
    contextString += `描述: ${thought.description}\n\n`;

    if (actions.length > 0) {
      contextString += `相关行动:\n`;
      actions.forEach((action, index) => {
        contextString += `${index + 1}. ${action.summary} (类型: ${action.type || '未知'})\n`;
      });
      contextString += '\n';
    }

    if (userChoices.length > 0) {
      contextString += `用户选择记录:\n`;
      userChoices.forEach((choice, index) => {
        contextString += `${index + 1}. 选择类型: ${choice.choice_type}\n`;
        if (choice.choice_content) {
          contextString += `   内容: ${JSON.stringify(choice.choice_content)}\n`;
        }
      });
      contextString += '\n';
    }

    if (actionHistory.length > 0) {
      contextString += `行动历史:\n`;
      actionHistory.slice(0, 5).forEach((history, index) => { // 只显示最近5条
        contextString += `${index + 1}. 状态: ${history.final_status}`;
        if (history.notes) {
          contextString += ` - ${history.notes}`;
        }
        contextString += `\n`;
      });
    }

    // Combine user message with context
    const messageWithContext = content + contextString;

    // Create user message record
    const userMessage = await ChatMessageModel.create({
      conversation_id: chatId,
      sender: 'user',
      content: content, // Store original content without context
      metadata: {
        thought_id: thought_id,
        has_context: true
      }
    });

    // Get AI response using the message with context
    // Use specific bot_id for chatWithAction interface
    const cozeServiceInstance = getCozeService();
    const chatWithActionBotId = '7553108566920626185';
    
    // Create a temporary service instance with the specific bot_id for this request
    const { CozeAPI, COZE_CN_BASE_URL, RoleType } = require('@coze/api');
    const serviceConfig = cozeServiceInstance.getConfig();
    const tempClient = new CozeAPI({
      token: serviceConfig.apiKey,
      baseURL: serviceConfig.baseUrl || 'https://api.coze.cn',
    });

    // Use the specific bot_id for chatWithAction
    const chatResult = await tempClient.chat.createAndPoll({
      bot_id: chatWithActionBotId,
      user_id: userId,
      auto_save_history: true,
      additional_messages: [
        {
          role: RoleType.User,
          content: messageWithContext,
          content_type: 'text',
        },
      ],
      conversation_id: chat.coze_conversation_id,
    });

    // Extract AI response from the result
    let aiResponse = 'Sorry, I encountered an error while processing your message. Please try again.';
    if (chatResult.messages && chatResult.messages.length > 0) {
      const aiMessages = chatResult.messages.filter((msg: any) => 
        msg.role === RoleType.Assistant && msg.type === 'answer'
      );
      
      if (aiMessages.length > 0) {
        aiResponse = aiMessages[aiMessages.length - 1].content;
      }
    }

    // Create AI message record
    const aiMessage = await ChatMessageModel.create({
      conversation_id: chatId,
      sender: 'bean',
      content: aiResponse,
      metadata: {}
    });

    // Update conversation timestamp
    await ChatModel.update(chatId, { updated_at: new Date().toISOString() });

    const response: SendMessageResponse = {
      user_message: userMessage,
      ai_message: aiMessage
    };

    res.status(201).json({
      success: true,
      data: response
    } as ApiResponse);
  } catch (error) {
    console.error('Error sending message with action context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message with action context'
    } as ApiResponse);
  }
};

export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if conversation exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Delete the conversation (messages will be cascade deleted)
    await ChatModel.delete(chatId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    } as ApiResponse);
  }
};

// ===== chatWithAction controllers (conversation_type: 'execution') =====

export const createChatWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatData: CreateChatRequest = req.body;
    const userId = req.user?.id;
    console.info('createChatWithAction - Request data:', chatData);
    console.info('createChatWithAction - User ID:', userId);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!chatData.thought_id || !chatData.bean_id) {
      res.status(400).json({
        success: false,
        error: 'Thought ID and Bean ID are required'
      } as ApiResponse);
      return;
    }

    // Check if thought exists and belongs to user
    const thought = await ThoughtModel.findById(chatData.thought_id);
    console.info('createChatWithAction - Found thought:', thought);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    if (thought.user_id !== userId) {
      console.info('createChatWithAction - Access denied - thought.user_id:', thought.user_id, 'userId:', userId);
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Create chat with execution type
    console.info('createChatWithAction - Creating chat with data:', {
      ...chatData,
      user_id: userId,
      conversation_type: 'execution'
    });
    const chat = await ChatModel.create({
      ...chatData,
      user_id: userId,
      conversation_type: 'execution'
    });
    console.info('createChatWithAction - Created chat:', chat);

    res.status(201).json({
      success: true,
      data: chat
    } as ApiResponse<Chat>);
  } catch (error) {
    console.error('Error creating action chat:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'Failed to create action chat'
    } as ApiResponse);
  }
};

export const getUserChatsWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const chats = await ChatModel.findByUserIdAndType(userId, 'execution');

    res.json({
      success: true,
      data: chats
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching action chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action chats'
    } as ApiResponse);
  }
};

export const getChatWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const chat = await ChatModel.findById(chatId);

    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Action chat not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    if (chat.conversation_type !== 'execution') {
      res.status(400).json({
        success: false,
        error: 'This is not an action chat'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: chat
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching action chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action chat'
    } as ApiResponse);
  }
};

export const deleteChatWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const chat = await ChatModel.findById(chatId);

    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Action chat not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    if (chat.conversation_type !== 'execution') {
      res.status(400).json({
        success: false,
        error: 'This is not an action chat'
      } as ApiResponse);
      return;
    }

    await ChatModel.delete(chatId);

    res.json({
      success: true,
      message: 'Action chat deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting action chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete action chat'
    } as ApiResponse);
  }
};

export const sendMessageWithActionNew = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { content, thought_id, mock_mode = false } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Message content is required'
      } as ApiResponse);
      return;
    }

    // Verify chat exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Action chat not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    if (chat.conversation_type !== 'execution') {
      res.status(400).json({
        success: false,
        error: 'This is not an action chat'
      } as ApiResponse);
      return;
    }

    // Create user message with action context metadata
    const userMessage = await ChatMessageModel.create({
      conversation_id: chatId,
      sender: 'user',
      content,
      metadata: {
        thought_id: thought_id || chat.thought_id,
        context_type: 'action',
        conversation_type: 'execution'
      }
    });

    let aiMessage;

    if (mock_mode) {
      // Mock mode response
      aiMessage = await ChatMessageModel.create({
        conversation_id: chatId,
        sender: 'bean',
        content: `这是一个模拟回复，针对执行过程的对话。我理解您关于想法执行的问题：${content}`,
        metadata: {
          mock_mode: true,
          bot_id: '7553108566920626185',
          conversation_type: 'execution'
        }
      });
    } else {
      // Get thought context for action execution
      const thoughtId = thought_id || chat.thought_id;
      const thought = await ThoughtModel.findById(thoughtId);
      
      if (!thought) {
        res.status(404).json({
          success: false,
          error: 'Associated thought not found'
        } as ApiResponse);
        return;
      }

      // Get action context
      const actions = await ActionModel.findByThoughtId(thoughtId);
      const choices = await UserChoiceModel.findByUserId(userId);
      const actionHistories = await ActionHistoryModel.findByUserId(userId);

      // For now, create a mock response with action context
      // TODO: Integrate with actual AI service
      const contextInfo = `
想法信息：
标题：${thought.title}
描述：${thought.description}

相关行动计划：
${actions.map(action => `- ${action.summary} (类型: ${action.type || '未知'})`).join('\n')}

用户选择记录：
${choices.slice(0, 5).map(choice => `- 行动ID: ${choice.action_id}, 选择: ${choice.choice_type}`).join('\n')}

行动历史：
${actionHistories.slice(0, 5).map(history => `- 行动ID: ${history.action_id}, 最终状态: ${history.final_status}`).join('\n')}
`;

      aiMessage = await ChatMessageModel.create({
        conversation_id: chatId,
        sender: 'bean',
        content: `我理解您关于想法执行的问题：${content}\n\n基于以下上下文信息：\n${contextInfo}\n\n这是一个针对执行过程的回复。我是专门为chatWithAction接口配置的AI助手（bot_id: 7553108566920626185）。`,
        metadata: {
          bot_id: '7553108566920626185',
          conversation_type: 'execution',
          context_included: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        user_message: userMessage,
        ai_message: aiMessage
      }
    } as ApiResponse<{user_message: ChatMessage, ai_message: ChatMessage}>);

  } catch (error) {
    console.error('Error sending action message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send action message'
    } as ApiResponse);
  }
};

export const sendMessageWithThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { content, sender, metadata } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Message content is required'
      } as ApiResponse);
      return;
    }

    // Check if conversation exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    if (chat.conversation_type !== 'thought') {
      res.status(400).json({
        success: false,
        error: 'This is not a thought chat'
      } as ApiResponse);
      return;
    }

    // Create user message
    const userMessage = await ChatMessageModel.create({
      conversation_id: chatId,
      sender: sender || 'user',
      content: content,
      metadata: metadata
    });

    // Get AI response from Coze with custom variables
    let aiResponseText = '';
    try {
      const cozeService = getCozeService();
      
      // Gather custom variables: thought content, username, and user preferences
      let thoughtContent = '';
      let username = '';
      let userPreferences = {};
      
      try {
         // Get thought content if this is a thought-based conversation
         if (chat.conversation_type === 'thought' && chat.thought_id) {
           const thought = await ThoughtModel.findById(chat.thought_id);
           if (thought) {
             thoughtContent = thought.description; // Use description instead of content
           }
         }
         
         // Get username from user data (assuming we have user info in the request)
         // For now, we'll use the userId as username, but this could be enhanced
         username = userId;
         
         // Get user preferences
         const preferences = await UserPreferenceModel.findByUserId(userId);
         if (preferences && preferences.length > 0) {
           // Convert preferences array to object for easier access
           userPreferences = preferences.reduce((acc, pref) => {
             acc[pref.preference_key] = pref.score; // Use score instead of preference_value
             return acc;
           }, {} as Record<string, any>);
         }
       } catch (dataError) {
         console.warn('Error gathering custom variables:', dataError);
         // Continue with empty values if data gathering fails
       }
      
      // Prepare custom variables for Coze
      const customVariables = {
        thought: thoughtContent
        // username: username,
        // user_preferences: userPreferences
      };
      console.info('sendMessageWithThought:', customVariables);
      // Use the existing Coze conversation ID if available
      const cozeConversationId = chat.coze_conversation_id;
      if (cozeConversationId) {
        aiResponseText = await cozeService.completeChat(userId, content, cozeConversationId, customVariables);
      } else {
        // Fallback: create a new conversation if not exists
        const newCozeConversationId = await cozeService.createConversation(userId);
        aiResponseText = await cozeService.completeChat(userId, content, newCozeConversationId, customVariables);
        
        // Update the chat record with the new Coze conversation ID
        await ChatModel.update(chat.id, { coze_conversation_id: newCozeConversationId });
      }
    } catch (cozeError) {
      console.error('Error getting AI response:', cozeError);
      aiResponseText = 'Sorry, I encountered an error while processing your message. Please try again.';
    }

    // Create AI message
    const aiMessage = await ChatMessageModel.create({
      conversation_id: chatId,
      sender: 'bean',
      content: aiResponseText,
      metadata: { generated_by: 'coze_service' }
    });

    // Update conversation's updated_at timestamp
    await ChatModel.update(chat.id, { updated_at: new Date().toISOString() });

    res.status(200).json({
      success: true,
      data: {
        user_message: userMessage,
        ai_message: aiMessage
      }
    } as ApiResponse<SendMessageResponse>);
  } catch (error) {
    console.error('Error sending message to thought chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    } as ApiResponse);
  }
};

export const getChatMessagesWithAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Verify chat exists and belongs to user
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Action chat not found'
      } as ApiResponse);
      return;
    }

    if (chat.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    if (chat.conversation_type !== 'execution') {
      res.status(400).json({
        success: false,
        error: 'This is not an action chat'
      } as ApiResponse);
      return;
    }

    const messages = await ChatMessageModel.findByConversationId(chatId);

    res.json({
      success: true,
      data: {
        messages,
        conversation_type: 'execution'
      }
    } as ApiResponse<{messages: ChatMessage[], conversation_type: string}>);
  } catch (error) {
    console.error('Error fetching action chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action chat messages'
    } as ApiResponse);
  }
};