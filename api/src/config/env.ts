import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().trim().regex(/^https?:\/\/.+/).default('http://localhost:5173'),
  SESSION_COOKIE_NAME: z.string().min(1).default('gcal_sid'),
  SESSION_JWT_SECRET: z.string().min(32),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  GOOGLE_REDIRECT_URI: z.string().trim().regex(/^https?:\/\/.+/),
  DATABASE_URL: z.string().min(10),
});

export const env = schema.parse(process.env);
