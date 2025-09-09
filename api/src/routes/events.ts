import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import * as Events from '@/controllers/events.controller';

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

// requireAuth duplicated
eventsRouter.get('/', requireAuth, Events.list);
eventsRouter.post('/', requireAuth, Events.create);
eventsRouter.post('/refresh', requireAuth, Events.refresh);
