import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', authenticateToken, getProfile);
