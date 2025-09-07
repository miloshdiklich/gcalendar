import { Router } from 'express';
import * as Auth from '@/controllers/auth.controller';

export const authRouter = Router();

authRouter.get('/google', Auth.loginRedirect);
authRouter.get('/google/callback', Auth.callback);
authRouter.post('/logout', Auth.logout);
authRouter.get('/me', Auth.getCurrentUser);
