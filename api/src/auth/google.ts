import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { encrypt } from '../services/crypto';
import { exchangeCodeForTokens, getAuthUrl } from '../services/google';
import { google } from 'googleapis';

export const authRouter = Router();

authRouter.get('/google', (_req, res) => res.redirect(getAuthUrl()));

authRouter.get('/google/callback', async (req, res) => {
  const code = String(req.query.code ?? '');
  const tokens = await exchangeCodeForTokens(code);
  
  // get user info
  const oauth2 = google.oauth2('v2');
  const client = new google.auth.OAuth2();
  client.setCredentials(tokens);
  const me = await oauth2.userinfo.get({ auth: client });
  const googleId = String(me.data.id ?? '');
  const email = String(me.data.email ?? '');
  const displayName = String(me.data.name ?? email);
  const photoUrl = String(me.data.picture ?? '');
  
  if (!googleId || !email) return res.status(400).json({ error: 'Missing Google identity' });
  
  const user = await prisma.user.upsert({
    where: { googleId },
    create: { googleId, email, displayName, photoUrl },
    update: { email, displayName, photoUrl },
  });
  
  await prisma.token.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      refreshTokenEnc: encrypt(String(tokens.refresh_token ?? '')),
      accessTokenEnc: tokens.access_token ? encrypt(tokens.access_token) : null,
      accessTokenExp: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope ?? null,
    },
    update: {
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      accessTokenEnc: tokens.access_token ? encrypt(tokens.access_token) : undefined,
      accessTokenExp: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope ?? undefined,
    },
  });
  
  const session = jwt.sign({ sub: user.id }, env.SESSION_JWT_SECRET, { expiresIn: '7d' });
  res.cookie(env.SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: false, // true behind HTTPS/proxy in prod
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.redirect(`${process.env.CORS_ORIGIN || env.CORS_ORIGIN}/`);
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});
