// src/lib/services/googleCalendar.ts (Enhanced with debugging)
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
}

// SERVER-SIDE ONLY - Do not import this in React components
class GoogleCalendarService {
  private calendar;

  constructor() {
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    
    // Enhanced debugging
    console.log('=== ENHANCED API Key Debug ===');
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
    console.log('All process.env keys containing "GOOGLE":', 
      Object.keys(process.env).filter(key => key.includes('GOOGLE')));
    console.log('Raw GOOGLE_CALENDAR_API_KEY:', process.env.GOOGLE_CALENDAR_API_KEY);
    console.log('API Key present:', !!apiKey);
    console.log('API Key type:', typeof apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
    console.log('API Key last 10 chars:', apiKey?.substring(apiKey.length - 10) || 'N/A');
    console.log('Expected first 10 chars: AIzaSyAqEk');
    console.log('Match expected:', apiKey?.substring(0, 10) === 'AIzaSyAqEk');
    console.log('===============================');
    
    if (!apiKey) {
      console.error('❌ GOOGLE_CALENDAR_API_KEY environment variable is not set!');
      console.log('Available env vars:', Object.keys(process.env).sort());
    } else if (apiKey !== 'AIzaSyAqEkf3Mv3POnCt3lZ6dQ69V0DXLukQEcc') {
      console.error('❌ API Key mismatch!');
      console.log('Expected: AIzaSyAqEkf3Mv3POnCt3lZ6dQ69V0DXLukQEcc');
      console.log('Actual:  ', apiKey);
    } else {
      console.log('✅ API Key matches expected value');
    }
    
    // Initialize with API key for public calendar access
    this.calendar = google.calendar({
      version: 'v3',
      auth: apiKey,
    });
  }

  async testApiKey(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test API key by making a simple request
      const response = await this.calendar.calendarList.list();
      return { success: true };
    } catch (error: any) {
      console.error('API Key test failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async testCalendarAccess(calendarId: string): Promise<{ 
    success: boolean; 
    error?: string; 
    calendarInfo?: any 
  }> {
    try {
      // Decode the calendar ID if it's URL encoded
      const decodedCalendarId = decodeURIComponent(calendarId);
      console.log(`Testing calendar access for: ${calendarId}`);
      console.log(`Decoded: ${decodedCalendarId}`);
      
      // Test if we can access the calendar metadata
      const response = await this.calendar.calendars.get({
        calendarId: decodedCalendarId
      });
      
      return { 
        success: true, 
        calendarInfo: {
          summary: response.data.summary,
          description: response.data.description,
          timeZone: response.data.timeZone,
          accessRole: response.data.accessRole
        }
      };
    } catch (error: any) {
      console.error(`Calendar access test failed for ${calendarId}:`, error);
      return { 
        success: false, 
        error: `${error.code}: ${error.message}` 
      };
    }
  }

  async getEvents(
    calendarId: string,
    startDate: string,
    endDate: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      // Decode the calendar ID if it's URL encoded
      const decodedCalendarId = decodeURIComponent(calendarId);
      
      console.log(`Attempting to fetch events from calendar: ${calendarId}`);
      console.log(`Decoded calendar ID: ${decodedCalendarId}`);
      console.log(`Date range: ${startDate} to ${endDate}`);
      
      // Skip metadata check and go directly to events
      console.log('Skipping metadata check, fetching events directly...');

      const response = await this.calendar.events.list({
        calendarId: decodedCalendarId,
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const events = response.data.items || [];
      console.log(`Successfully retrieved ${events.length} events from calendar ${decodedCalendarId}`);
      
      if (events.length > 0) {
        console.log('Sample events:', events.slice(0, 3).map(e => ({ 
          summary: e.summary, 
          start: e.start?.date || e.start?.dateTime 
        })));
      }
      
      return events.map((event) => ({
        id: event.id || Math.random().toString(),
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || '',
        location: event.location || '',
        isAllDay: !event.start?.dateTime, // If no time, it's all day
        isPublic: event.visibility !== 'private',
        source: 'google',
      }));
    } catch (error: any) {
      console.error(`Error fetching Google Calendar events from ${calendarId}:`, error);
      console.error(`Error details:`, {
        code: error.code,
        message: error.message,
        errors: error.errors,
        status: error.status
      });
      
      // Try with original calendar ID if decoding might be the issue
      if (calendarId !== decodedCalendarId) {
        console.log('Retrying with original calendar ID format...');
        try {
          const response = await this.calendar.events.list({
            calendarId: calendarId,
            timeMin: `${startDate}T00:00:00Z`,
            timeMax: `${endDate}T23:59:59Z`,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
          });
          
          const events = response.data.items || [];
          console.log(`Success with original format! Retrieved ${events.length} events`);
          
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
          }));
        } catch (retryError: any) {
          console.error('Retry with original format also failed:', retryError);
        }
      }
      
      return [];
    }
  }

  async getMultipleCalendarEvents(
    calendarIds: string[],
    startDate: string,
    endDate: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      console.log(`Fetching events from ${calendarIds.length} calendars:`, calendarIds);
      
      const promises = calendarIds.map(async (calendarId) => {
        console.log(`Processing calendar: ${calendarId}`);
        return this.getEvents(calendarId, startDate, endDate);
      });
      
      const results = await Promise.all(promises);
      const allEvents = results.flat();
      
      console.log(`Total events retrieved: ${allEvents.length}`);
      return allEvents;
    } catch (error) {
      console.error('Error fetching multiple calendar events:', error);
      return [];
    }
  }

  // Debug method to list available calendars (requires OAuth)
  async listAvailableCalendars(): Promise<any[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendars:', error);
      return [];
    }
  }
}

// Only export the service for server-side use
export const googleCalendarService = new GoogleCalendarService();
