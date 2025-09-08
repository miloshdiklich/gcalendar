import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export type AuthedRequest = Request & { userId?: string };

/**
 * Middleware to require authentication via JWT in cookies.
 * @param req
 * @param res
 * @param next
 */
export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const raw = (req as any).cookies?.[env.SESSION_COOKIE_NAME];
  if (!raw) return res.status(401).json({ error: 'unauthorized' });
  try {
    const decoded = jwt.verify(raw, env.SESSION_JWT_SECRET) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
};
