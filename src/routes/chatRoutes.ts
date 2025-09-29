import { Router } from 'express';
import { 
  createChat, 
  sendMessage, 
  getChatMessages, 
  getUserChats, 
  getChat, 
  sendMessageWithAction,
  deleteChat,
  createChatWithAction,
  sendMessageWithActionNew,
  getChatMessagesWithAction,
  getUserChatsWithAction,
  getChatWithAction,
  deleteChatWithAction,
  sendMessageWithThought
} from '../controllers/chatController';
import { authenticateToken, mockAuth } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';

const router = Router();

// ===== chatWithThought routes (conversation_type: 'thought') =====
// Get user's thought chats
router.get('/with-thought', authenticateToken, ensureUser, getUserChats);

// Create new thought chat
router.post('/with-thought', authenticateToken, ensureUser, createChat);

// Get specific thought chat
router.get('/with-thought/:chatId', authenticateToken, ensureUser, getChat);

// Delete thought chat
router.delete('/with-thought/:chatId', authenticateToken, ensureUser, deleteChat);

// Send message to thought chat
router.post('/with-thought/:chatId/messages', authenticateToken, ensureUser, sendMessageWithThought);

// Get messages from thought chat
router.get('/with-thought/:chatId/messages', authenticateToken, ensureUser, getChatMessages);

// ===== chatWithAction routes (conversation_type: 'execution') =====
// Get user's action chats
router.get('/with-action', authenticateToken, ensureUser, getUserChatsWithAction);

// Create new action chat
router.post('/with-action', authenticateToken, ensureUser, createChatWithAction);

// Get specific action chat
router.get('/with-action/:chatId', authenticateToken, ensureUser, getChatWithAction);

// Delete action chat
router.delete('/with-action/:chatId', authenticateToken, ensureUser, deleteChatWithAction);

// Send message to action chat
router.post('/with-action/:chatId/messages', authenticateToken, ensureUser, sendMessageWithActionNew);

// Get messages from action chat
router.get('/with-action/:chatId/messages', authenticateToken, ensureUser, getChatMessagesWithAction);

// ===== Legacy routes (for backward compatibility) =====
// Get user's chats (defaults to thought type)
router.get('/', authenticateToken, ensureUser, getUserChats);

// Create new chat (defaults to thought type)
router.post('/', authenticateToken, ensureUser, createChat);

// Get specific chat
router.get('/:chatId', authenticateToken, ensureUser, getChat);

// Delete chat
router.delete('/:chatId', authenticateToken, ensureUser, deleteChat);

// Send message to chat
router.post('/:chatId/messages', authenticateToken, ensureUser, sendMessage);

// Send message with action to chat
router.post('/:chatId/messages/with-action', authenticateToken, ensureUser, sendMessageWithAction);

// Get messages from chat
router.get('/:chatId/messages', authenticateToken, ensureUser, getChatMessages);

export default router;