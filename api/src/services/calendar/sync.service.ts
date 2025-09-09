import { calendar_v3 } from 'googleapis';
import { addMonths, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '@/db/prisma';
import { getAuthClient } from '@/services/auth/google.service';
import type { Event } from '@prisma/client';

// interesting
const iso = (date: Date): string => date.toISOString();

/**
 * Synchronizes Google Calendar events for a user within a six-month window,
 * spanning three months before and three months after the current date.
 *
 * This asynchronous function retrieves events from the user's primary Google Calendar,
 * processes them, and upserts each event's details (including event ID, title, timestamps, and timezone)
 * into a database using Prisma. The function fetches all events by iterating through paginated results
 * provided by the Google Calendar API.
 *
 * @param {string} userId - The unique identifier for the user whose calendar events need to be synchronized.
 * @returns {Promise<void>} A promise that resolves when the synchronization process is complete.
 * @throws Will propagate errors encountered during API calls, event processing, or database operations.
 */
export const syncThreeMonths = async(userId: string): Promise<void> => {
  const calendar = await getAuthClient(userId);
  const timeMin = iso(startOfDay(addMonths(new Date(), -3)));
  const timeMax = iso(endOfDay(addMonths(new Date(), 3)));
  
  const fetchAndProcessEvents = async(pageToken?: string): Promise<void> => {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      pageToken,
    });
    
    const events = response.data.items ?? [];
    
    // what if an event was deleted between refreshes?
    await Promise.all(
      events.map(async(event) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        if (!event.id || !start || !end) return;
        const tz = event.start?.timeZone || null;
        
        const eventData = {
          summary: event.summary ?? 'No Title',
          startTime: new Date(start),
          endTime: new Date(end),
          timeZone: tz,
          etag: event.etag || null,
        };
        
        await prisma.event.upsert({
          where: { googleEventId: event.id },
          create: { googleEventId: event.id, userId, ...eventData },
          update: eventData,
        });
      })
    );
    
    if (response.data.nextPageToken) {
      await fetchAndProcessEvents(response.data.nextPageToken);
    }
  };
  
  // wow recursion
  await fetchAndProcessEvents();
};

/**
 * Lists events for a user within a specified range of days from the current date.
 * @param userId
 * @param days
 */
export const listEventsRange = async (
  userId: string,
  days: number,
): Promise<calendar_v3.Schema$Event[]> => {
  const now = new Date();
  const to = addMonths(now, days);
  const rows = await prisma.event.findMany({
    where: { userId, startTime: { gte: now, lte: to } },
    orderBy: { startTime: 'asc' },
  });
  
  // could this have been done in the DB query directly? - json_build_object
  return rows.map((row: Event) => ({
    id: row.googleEventId,
    summary: row.summary,
    start: {
      dateTime: row.startTime.toISOString(),
      timeZone: row.timeZone || undefined,
    },
    end: {
      dateTime: row.endTime.toISOString(),
      timeZone: row.timeZone || undefined,
    }
  }))
};
