import { Router } from 'express';
import type { Request, Response } from 'express';
import thoughtRoutes from './thoughtRoutes';
import actionRoutes from './actionRoutes';
import choiceRoutes from './choiceRoutes';
import authRoutes from './authRoutes';
import cozeRoutes from './cozeRoutes';
import chatRoutes from './chatRoutes';
import workflowRoutes from './workflowRoutes';
import beanRoutes from './beanRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Cobean API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount feature routes
router.use('/auth', authRoutes);
router.use('/thoughts', thoughtRoutes);
router.use('/actions', actionRoutes);
router.use('/choices', choiceRoutes);
router.use('/coze', cozeRoutes);
router.use('/chats', chatRoutes);
router.use('/workflow', workflowRoutes);
router.use('/beans', beanRoutes);

export default router;