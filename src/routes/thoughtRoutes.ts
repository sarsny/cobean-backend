import { Router } from 'express';
import { 
  createThought, 
  getThought, 
  getThoughts, 
  getThoughtContext, 
  updateThought, 
  deleteThought,
  getPublicThoughts,
  getThoughtWithConversation,
  updateThoughtStageToInProgress,
  createThoughtWithConversation
} from '../controllers/thoughtController';
import { authenticateToken } from '../middleware/auth';
import { validateCreateThought, validateUpdateThought } from '../middleware/validation';

const router = Router();

// GET /api/thoughts/public - Get all public thoughts (no authentication required)
router.get('/public', getPublicThoughts);

// Apply authentication middleware to all other routes
router.use(authenticateToken);

// POST /api/thoughts - Create a new thought
router.post('/', validateCreateThought, createThought);

// POST /api/thoughts/with-conversation - Create a new thought with conversation and initial message
router.post('/with-conversation', validateCreateThought, createThoughtWithConversation);

// GET /api/thoughts - Get all thoughts for authenticated user
router.get('/', getThoughts);

// GET /api/thoughts/:id - Get a specific thought
router.get('/:id', getThought);

// GET /api/thoughts/:id/with-conversation - Get thought with associated conversation data
router.get('/:id/with-conversation', getThoughtWithConversation);

// GET /api/thoughts/:id/context - Get thought context (thought + actions + choices + preferences)
router.get('/:id/context', getThoughtContext);

// PUT /api/thoughts/:id - Update a thought
router.put('/:id', validateUpdateThought, updateThought);

// PUT /api/thoughts/:id/start - Update thought stage to in_progress
router.put('/:id/start', updateThoughtStageToInProgress);

// DELETE /api/thoughts/:id - Delete a thought
router.delete('/:id', deleteThought);

export default router;