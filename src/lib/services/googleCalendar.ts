// src/lib/services/googleCalendar.ts (Cleaned up production version)
import { google } from 'googleapis';

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  isPublic: boolean;
  source: 'google';
  calendarName?: string;
}

// SERVER-SIDE ONLY - Do not import this in React components
class GoogleCalendarService {
  private calendar;

  constructor() {
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    
    if (!apiKey) {
      console.warn('GOOGLE_CALENDAR_API_KEY not configured - Google Calendar features disabled');
    }
    
    // Initialize with API key for public calendar access
    this.calendar = google.calendar({
      version: 'v3',
      auth: apiKey,
    });
  }

  async getEvents(
    calendarId: string,
    startDate: string,
    endDate: string,
    calendarName?: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: decodeURIComponent(calendarId),
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const events = response.data.items || [];
      
      return events.map((event) => ({
        id: event.id || Math.random().toString(),
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || '',
        location: event.location || '',
        isAllDay: !event.start?.dateTime,
        isPublic: event.visibility !== 'private',
        source: 'google',
        calendarName: calendarName,
      }));
    } catch (error: any) {
      console.error(`Error fetching Google Calendar events from ${calendarId}:`, error.message);
      return [];
    }
  }

  async getMultipleCalendarEvents(
    calendars: Array<{id: string, name: string}>,
    startDate: string,
    endDate: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const promises = calendars.map(async (calendar) => {
        return this.getEvents(calendar.id, startDate, endDate, calendar.name);
      });
      
      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching multiple calendar events:', error);
      return [];
    }
  }
}

// Only export the service for server-side use
export const googleCalendarService = new GoogleCalendarService();
