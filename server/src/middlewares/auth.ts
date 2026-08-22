import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'muralis_super_secret_jwt_key_2026';

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err || !decoded) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  });
}
