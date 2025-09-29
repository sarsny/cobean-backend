import { Router } from 'express';
import { mockAuth } from '../middleware/auth';
import { 
  validateCreateThought, 
  validateUpdateThought,
  validateGenerateAction,
  validateUpdateActionStatus,
  validateCreateChoice,
  validateUpdateChoice
} from '../middleware/validation';
import {
  mockThoughtOperations,
  mockActionOperations,
  mockChoiceOperations,
  enableMockMode,
  clearMockData
} from '../middleware/mockData';

const router = Router();

// Enable mock mode for all routes in this router
router.use(enableMockMode);

// Mock Thought routes
router.post('/thoughts', mockAuth, validateCreateThought, mockThoughtOperations.create);
router.get('/thoughts', mockAuth, mockThoughtOperations.getAll);
router.get('/thoughts/:id', mockAuth, mockThoughtOperations.getById);
router.put('/thoughts/:id', mockAuth, validateUpdateThought, mockThoughtOperations.update);
router.delete('/thoughts/:id', mockAuth, mockThoughtOperations.delete);

// Mock Action routes
router.post('/actions/generate', mockAuth, validateGenerateAction, mockActionOperations.generate);
router.get('/actions', mockAuth, mockActionOperations.getAll);
router.get('/actions/:id', mockAuth, mockActionOperations.getById);
router.put('/actions/:id/status', mockAuth, validateUpdateActionStatus, mockActionOperations.updateStatus);

// Mock Choice routes
router.post('/choices', mockAuth, validateCreateChoice, mockChoiceOperations.create);
router.get('/choices', mockAuth, mockChoiceOperations.getAll);
router.get('/choices/:id', mockAuth, mockChoiceOperations.getById);

// Mock Chat routes (for testing)
router.post('/chats', (req, res) => {
  const mockChat = {
    id: `mock-chat-${Date.now()}`,
    title: req.body.title || 'Mock Chat',
    user_id: 'mock-user-id',
    coze_conversation_id: `mock-coze-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  res.status(201).json(mockChat);
});

// Utility routes for testing
router.post('/clear-data', (req, res) => {
  clearMockData();
  res.json({
    success: true,
    message: 'All mock data cleared successfully'
  });
});

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Mock API is running',
    mode: 'mock',
    timestamp: new Date().toISOString()
  });
});

export default router;