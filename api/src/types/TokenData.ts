export type TokenData = {
  refreshTokenEnc: string;
  accessTokenEnc: string | undefined;
  accessTokenExp: Date | null;
  scope: string | null;
};
