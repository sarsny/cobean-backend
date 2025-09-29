import { Router } from 'express';
import { 
  createChoice, 
  getChoice, 
  getChoicesByAction, 
  getChoicesByThought, 
  getUserChoices, 
  updateChoice, 
  deleteChoice 
} from '../controllers/choiceController';
import { authenticateToken } from '../middleware/auth';
import { validateCreateChoice, validateUpdateChoice } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/choices - Create a new choice
router.post('/', validateCreateChoice, createChoice);

// GET /api/choices/:id - Get a specific choice
router.get('/:id', getChoice);

// GET /api/choices/action/:actionId - Get choices for a specific action
router.get('/action/:actionId', getChoicesByAction);

// GET /api/choices/thought/:thoughtId - Get choices for a specific thought
router.get('/thought/:thoughtId', getChoicesByThought);

// GET /api/choices/user - Get choices for authenticated user
router.get('/user', getUserChoices);

// PUT /api/choices/:id - Update a choice
router.put('/:id', validateUpdateChoice, updateChoice);

// DELETE /api/choices/:id - Delete a choice
router.delete('/:id', deleteChoice);

export default router;