import { Router } from 'express';
import { BeanController } from '../controllers/beanController';
import { authenticateToken, mockAuth } from '../middleware/auth';

const router = Router();

// Use mock authentication for development/testing
// In production, replace mockAuth with authenticateToken
const authMiddleware = process.env.NODE_ENV === 'production' ? authenticateToken : mockAuth;

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Bean CRUD routes
router.post('/', BeanController.createBean);
router.get('/:id', BeanController.getBeanById);
router.get('/user/:userId', BeanController.getBeansByUserId);
router.get('/user/:userId/status', BeanController.getBeansByStatus);
router.put('/:id', BeanController.updateBean);
router.delete('/:id', BeanController.deleteBean);

export default router;