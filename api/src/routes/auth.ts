import { Router } from 'express';
import * as Auth from '@/controllers/auth.controller';
import {requireAuth} from "@/middleware/auth";

export const authRouter = Router();

// Public routes
authRouter.get('/google', Auth.loginRedirect);
authRouter.get('/google/callback', Auth.callback);

// Protected routes (auth required)
authRouter.post('/logout', requireAuth, Auth.logout);
authRouter.get('/me', requireAuth, Auth.getCurrentUser);
