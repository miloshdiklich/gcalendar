import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { env } from '@/config/env';
import { prisma } from '@/db/prisma';
import { encrypt } from '@/utils/crypto';
import { asyncH } from '@/middleware/error';
import {
  getAuthUrl,
  setNewTokens,
  exchangeCodeForTokens
} from '@/services/auth/google.service';
import { upsertGoogleUser, findUserById} from '@/services/user/user.service';

export const loginRedirect = (_req: any, res: any): void => {
  res.redirect(getAuthUrl());
}

export const callback = asyncH(async(req, res) => {
  const code = String(req.query.code ?? '');
  const tokens = await exchangeCodeForTokens(code);
  
  const oauth2Client = await setNewTokens(tokens);
  const oauth2Service = google.oauth2('v2');
  
  const me = await oauth2Service.userinfo.get({ auth: oauth2Client });
  
  const user = await upsertGoogleUser(me, tokens);
  
  const session = jwt.sign({ sub: user.id }, env.SESSION_JWT_SECRET, { expiresIn: '1d' });
  res.cookie(env.SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  
  res.redirect(`${process.env.CORS_ORIGIN || env.CORS_ORIGIN}/`);
});

export const getCurrentUser = asyncH(async(req: any, res: any): Promise<any> => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  
  const user = await findUserById(userId);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
  
});

export const logout = asyncH(async(_req, res) => {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});
