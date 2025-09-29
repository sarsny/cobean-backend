import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { analyzeThoughtAndActions, triggerWorkflowAnalysis } from '../controllers/workflowController';

const router = Router();

/**
 * 分析指定思考的工作流
 * GET /api/v1/workflow/analyze/:thoughtId
 */
router.get('/analyze/:thoughtId', authenticateToken, analyzeThoughtAndActions);

/**
 * 手动触发工作流分析（用于测试）
 * POST /api/v1/workflow/trigger
 */
router.post('/trigger', authenticateToken, triggerWorkflowAnalysis);

/**
 * 测试工作流分析（无需认证，仅用于开发测试）
 * POST /api/v1/workflow/test
 */
router.post('/test', triggerWorkflowAnalysis);

export default router;