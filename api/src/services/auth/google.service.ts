import { google } from 'googleapis';
import { prisma } from '@/db/prisma';
import { encrypt, decrypt } from '@/utils/crypto';
import { env } from '@/config/env';

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export type Tokens = {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  expiry_date?: number;
}

const isExpired = (expiryDate?: number): boolean => {
  return typeof expiryDate === 'number' ? Date.now() > expiryDate - 60_000 : true;
};

export const setNewTokens = async(tokens: Tokens) => {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export const getOAuth2Client = async(userId?: string, tokens?: Tokens) => {
  if (!userId && tokens) {
    console.log('Using provided tokens for OAuth2 client');
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }
  
  const token = await prisma.token.findUnique({ where: { userId } });
  if (!token) throw new Error('No refresh token found');
  
  const stored = {
    refresh_token: decrypt(token.refreshTokenEnc),
    access_token: decrypt(token.accessTokenEnc || ''),
    expiry_date: token.accessTokenExp?.getTime(),
    scope: token.scope ?? undefined,
  }
  oauth2Client.setCredentials(stored);
  
  if (isExpired(stored.expiry_date)) {
    const newTokens = await oauth2Client.refreshAccessToken();
    const t = newTokens.credentials;
    await prisma.token.update({
      where: { userId },
      data: {
        accessTokenEnc: t.access_token ? encrypt(t.access_token) : undefined,
        accessTokenExp: t.expiry_date ? new Date(t.expiry_date) : null,
        scope: t.scope ?? null,
      },
    });
    oauth2Client.setCredentials(t);
  }
  
  return oauth2Client;
};

export const getAuthClient = async(userId: string) => {
  const token = await prisma.token.findUnique({ where: { userId } });
  if (!token) throw new Error('No refresh token found');
  
  const stored = {
    refresh_token: decrypt(token.refreshTokenEnc),
    access_token: decrypt(token.accessTokenEnc || ''),
    expiry_date: token.accessTokenExp?.getTime(),
    scope: token.scope ?? undefined,
  }
  oauth2Client.setCredentials(stored);
  
  if (isExpired(stored.expiry_date)) {
    const newTokens = await oauth2Client.refreshAccessToken();
    const t = newTokens.credentials;
    await prisma.token.update({
      where: { userId },
      data: {
        accessTokenEnc: t.access_token ? encrypt(t.access_token) : undefined,
        accessTokenExp: t.expiry_date ? new Date(t.expiry_date) : null,
        scope: t.scope ?? null,
      },
    });
    oauth2Client.setCredentials(t);
  }
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getAuthUrl = () => oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.events'
  ],
});

export const exchangeCodeForTokens = async(code: string): Promise<Tokens> => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as Tokens;
}

