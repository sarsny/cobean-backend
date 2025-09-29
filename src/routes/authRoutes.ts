import { Router } from 'express';
import { 
  register, 
  login, 
  getCurrentUser, 
  logout 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - 用户注册
router.post('/register', register);

// POST /api/auth/login - 用户登录
router.post('/login', login);

// GET /api/auth/me - 获取当前用户信息 (需要认证)
router.get('/me', authenticateToken, getCurrentUser);

// POST /api/auth/logout - 用户登出 (需要认证)
router.post('/logout', authenticateToken, logout);

export default router;