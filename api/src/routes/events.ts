import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';

export const eventsRouter = Router();
eventsRouter.use(requireAuth);


