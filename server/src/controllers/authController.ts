import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      plan: 'free'
    });

    const jwtSecret = process.env.JWT_SECRET || 'muralis_super_secret_jwt_key_2026';
    const refreshSecret = process.env.REFRESH_SECRET || 'muralis_super_secret_refresh_key_2026';

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      },
      token,
      refreshToken
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'muralis_super_secret_jwt_key_2026';
    const refreshSecret = process.env.REFRESH_SECRET || 'muralis_super_secret_refresh_key_2026';

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      },
      token,
      refreshToken
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'plan', 'createdAt']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
