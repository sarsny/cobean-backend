import { Router } from 'express';
import {
  createConversation,
  chat,
  completeChat,
  getChatStatus,
  getMessageList,
  clearConversation,
  getConversationId,
} from '../controllers/cozeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 应用认证中间件到所有路由
router.use(authenticateToken);

/**
 * @route POST /api/v1/coze/conversation
 * @desc 创建新会话
 * @access Private
 */
router.post('/conversation', createConversation);

/**
 * @route GET /api/v1/coze/conversation
 * @desc 获取用户当前会话ID
 * @access Private
 */
router.get('/conversation', getConversationId);

/**
 * @route DELETE /api/v1/coze/conversation
 * @desc 清除用户会话
 * @access Private
 */
router.delete('/conversation', clearConversation);

/**
 * @route POST /api/v1/coze/chat
 * @desc 发起对话（异步）
 * @access Private
 * @body { message: string, conversation_id?: string }
 */
router.post('/chat', chat);

/**
 * @route POST /api/v1/coze/chat/complete
 * @desc 完整对话流程（同步等待回复）
 * @access Private
 * @body { message: string, conversation_id?: string }
 */
router.post('/chat/complete', completeChat);

/**
 * @route GET /api/v1/coze/chat/status
 * @desc 获取对话状态
 * @access Private
 * @query { conversation_id: string, chat_id: string }
 */
router.get('/chat/status', getChatStatus);

/**
 * @route GET /api/v1/coze/chat/messages
 * @desc 获取对话消息列表
 * @access Private
 * @query { conversation_id: string, chat_id: string }
 */
router.get('/chat/messages', getMessageList);

export default router;