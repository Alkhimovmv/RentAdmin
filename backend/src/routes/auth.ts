import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.get('/verify', authMiddleware, authController.verify.bind(authController));

export default router;