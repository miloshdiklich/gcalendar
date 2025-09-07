import 'dotenv/config';
import express, {Express} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from '@/config/env';
import { authRouter } from '@/routes/auth';

/**
 * Build and configure the Express application
 */
export const buildApp = (): Express => {
  const app: Express = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  
  // Health check route
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  
  // Auth routes
  app.use('/auth', authRouter);
  
  return app;
}
