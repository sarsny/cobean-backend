import { Router } from 'express';
import { 
  generateAction, 
  getAction, 
  getActionsByThought, 
  updateActionStatus, 
  createActionHistory, 
  getActionHistory 
} from '../controllers/actionController';
import { authenticateToken } from '../middleware/auth';
import { 
  validateGenerateAction, 
  validateUpdateActionStatus, 
  validateCreateActionHistory 
} from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/actions/generate - Generate a new action for a thought
router.post('/generate', validateGenerateAction, generateAction);

// GET /api/actions/:id - Get a specific action
router.get('/:id', getAction);

// GET /api/actions/thought/:thoughtId - Get actions for a specific thought
router.get('/thought/:thoughtId', getActionsByThought);

// PUT /api/actions/:id/status - Update action status
router.put('/:id/status', validateUpdateActionStatus, updateActionStatus);

// POST /api/actions/:id/history - Create action history record
router.post('/:id/history', validateCreateActionHistory, createActionHistory);

// GET /api/actions/:id/history - Get action history
router.get('/:id/history', getActionHistory);

export default router;