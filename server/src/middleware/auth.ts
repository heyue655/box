import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'heyue_box_secret';

export interface SsoPayload {
  id: number;
  nickname: string;
}

declare global {
  namespace Express {
    interface Request {
      ssoUser?: SsoPayload;
    }
  }
}

export function authSso(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, message: '未登录' });
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as SsoPayload;
    req.ssoUser = payload;
    next();
  } catch {
    return res.status(401).json({ code: 1, message: 'Token 已过期，请重新登录' });
  }
}
