import 'dotenv/config';
import express, {Express} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';

/**
 * Build and configure the Express application
 */
export const buildApp = (): Express => {
  const app: Express = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  
  return app;
}
