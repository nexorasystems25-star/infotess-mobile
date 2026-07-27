import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export interface TokenPayload {
  id: number;
  role: string;
  type: 'student' | 'admin';
  name: string;
  email?: string;
  index_number?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateTokens(payload: TokenPayload): { access_token: string; refresh_token: string } {
  const access_token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
  const refresh_token = jwt.sign({ id: payload.id, role: payload.role }, config.jwtRefreshSecret, { expiresIn: config.refreshTokenExpiry });
  return { access_token, refresh_token };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): { id: number; role: string } {
  return jwt.verify(token, config.jwtRefreshSecret) as { id: number; role: string };
}