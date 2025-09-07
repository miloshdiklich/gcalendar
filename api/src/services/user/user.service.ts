import { prisma } from '@/db/prisma';
import { encrypt } from '@/utils/crypto';
import type { Tokens } from '@/services/auth/google.service';
import type { oauth2_v2 } from 'googleapis';

type GoogleUserInfo = {
  data: oauth2_v2.Schema$Userinfo;
};

export const createTokenData = (tokens: Tokens) => ({
  refreshTokenEnc: encrypt(String(tokens.refresh_token ?? '')),
  accessTokenEnc: tokens.access_token ? encrypt(tokens.access_token) : undefined,
  accessTokenExp: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  scope: tokens.scope ?? null,
});

export const parseGoogleUserInfo = (userInfo: GoogleUserInfo) => {
  const googleId = String(userInfo.data.id || '');
  const email = String(userInfo.data.email || '');
  const displayName = String(userInfo.data.name || '');
  const photoUrl = String(userInfo.data.picture || '');

  if (!googleId || !email) {
    throw new Error('Failed to get Google user info');
  }

  return { googleId, email, displayName, photoUrl };
};

export const upsertUserToken = async (userId: string, tokens: Tokens) => {
  const tokenData = createTokenData(tokens);
  
  return prisma.token.upsert({
    where: { userId },
    create: {
      userId,
      ...tokenData
    },
    update: tokenData,
  });
};

export const upsertGoogleUser = async (userInfo: GoogleUserInfo, tokens: Tokens) => {
  const userData = parseGoogleUserInfo(userInfo);
  
  const user = await prisma.user.upsert({
    where: { googleId: userData.googleId },
    create: userData,
    update: userData,
  });

  await upsertUserToken(user.id, tokens);
  return user;
};

export const findUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      displayName: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
