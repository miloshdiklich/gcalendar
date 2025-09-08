import { z } from 'zod';
import { prisma } from '@/db/prisma';
import { AuthedRequest } from '@/middleware/auth';
import { asyncH } from '@/middleware/error';
import { getCalendarClientForUser } from '@/services/auth/google.service';
import { syncThreeMonths } from '@/services/calendar/sync.service';

// Query: GET /api/events?rangeDays=1|7|30 (default 7)
const ListQuery = z.object({ rangeDays: z.coerce.number().default(7) });

// Body: POST /api/events
const CreateEvent = z.object({
  summary: z.string().min(1),
  date: z.string(),      // YYYY-MM-DD
  startTime: z.string(), // HH:mm
  endTime: z.string(),   // HH:mm
  timeZone: z.string().optional(),
});

export const list = asyncH(async (req: AuthedRequest, res) => {
  const { rangeDays } = ListQuery.parse(req.query);
  const userId = String(req.userId);
  const now = new Date();
  const to = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000);
  
  const rows = await prisma.event.findMany({
    where: { userId, startTime: { gte: now, lte: to } },
    orderBy: { startTime: 'asc' },
  });
  
  res.json({ events: rows });
});

export const create = asyncH(async (req: AuthedRequest, res) => {
  const body = CreateEvent.parse(req.body);
  const userId = String(req.userId);
  
  const startIso = new Date(`${body.date}T${body.startTime}:00`).toISOString();
  const endIso   = new Date(`${body.date}T${body.endTime}:00`).toISOString();
  
  const cal = await getCalendarClientForUser(userId);
  const created = await cal.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: body.summary,
      start: { dateTime: startIso, timeZone: body.timeZone },
      end:   { dateTime: endIso,   timeZone: body.timeZone },
    },
  });
  
  const e = created.data;
  if (!e.id || !e.start || !e.end) throw Object.assign(new Error('Bad Google response'), { status: 502 });
  
  await prisma.event.upsert({
    where: { googleEventId: e.id },
    create: {
      googleEventId: e.id,
      userId,
      summary: e.summary ?? body.summary,
      startTime: new Date(e.start.dateTime ?? e.start.date!),
      endTime:   new Date(e.end.dateTime   ?? e.end.date!),
      timeZone: body.timeZone ?? null,
      etag: e.etag ?? null,
    },
    update: {
      summary: e.summary ?? body.summary,
      startTime: new Date(e.start.dateTime ?? e.start.date!),
      endTime:   new Date(e.end.dateTime   ?? e.end.date!),
      timeZone: body.timeZone ?? null,
      etag: e.etag ?? null,
    },
  });
  
  res.status(201).json({ ok: true, eventId: e.id });
});

// POST /api/events/refresh — fetch +/- 3 months from Google, upsert to DB
export const refresh = asyncH(async (req: AuthedRequest, res) => {
  await syncThreeMonths(String(req.userId));
  res.json({ ok: true });
});
