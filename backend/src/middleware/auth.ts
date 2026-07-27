import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    type: 'student' | 'admin';
    name: string;
    email?: string;
    index_number?: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.type !== 'admin' && req.user?.role !== 'super_admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.type !== 'student') {
    res.status(403).json({ error: 'Student access required' });
    return;
  }
  next();
}