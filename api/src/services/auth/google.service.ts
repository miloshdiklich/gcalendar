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
  access_token?: string;
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
  
  // Is there a race condition here?
  if (isExpired(stored.expiry_date)) {
    const newTokens = await oauth2Client.refreshAccessToken();
    const t = newTokens.credentials;
    // should refresh token be updated too?
    await prisma.token.update({
      where: { userId },
      data: {
        accessTokenEnc: t.access_token ? encrypt(t.access_token) : undefined,
        accessTokenExp: t.expiry_date ? new Date(t.expiry_date) : null,
        scope: t.scope ?? null,
      },
    });
    // this overwrites the singleton and can cause race conditions
    oauth2Client.setCredentials(t);
  }
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getCalendarClientForUser = async (userId: string) => {
  // Load stored tokens
  const tokenRow = await prisma.token.findUnique({ where: { userId } });
  if (!tokenRow) throw new Error('No tokens stored for user');
  
  const creds: Tokens = {
    refresh_token: decrypt(tokenRow.refreshTokenEnc),
    access_token: tokenRow.accessTokenEnc ? decrypt(tokenRow.accessTokenEnc) : undefined,
    expiry_date: tokenRow.accessTokenExp?.getTime() ?? undefined,
    scope: tokenRow.scope ?? undefined,
  };
  
  // Set known credentials
  oauth2Client.setCredentials(creds);
  
  // Ensure we have a valid access token
  if (!creds.access_token || isExpired(creds.expiry_date)) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    // why cast when already typed
    const next = credentials as Tokens;
    
    // Persist updated tokens
    await prisma.token.update({
      where: { userId },
      data: {
        accessTokenEnc: next.access_token ? encrypt(next.access_token) : null,
        accessTokenExp: next.expiry_date ? new Date(next.expiry_date) : null,
        scope: next.scope ?? tokenRow.scope,
        refreshTokenEnc: next.refresh_token
          ? encrypt(next.refresh_token)
          : tokenRow.refreshTokenEnc,
      },
    });
    
    oauth2Client.setCredentials(next);
  }
  
  // Return an authenticated Calendar client
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

