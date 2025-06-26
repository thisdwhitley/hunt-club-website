// src/lib/services/clientGoogleCalendar.ts (Updated to match server interface)
// This service makes HTTP requests to your API routes - safe for React components

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
  
  // CLIENT-SIDE ONLY - Safe to import in React components
  export class ClientGoogleCalendarService {
    async getEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
      try {
        const response = await fetch(
          `/api/calendar/google?start=${startDate}&end=${endDate}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const events = await response.json();
        return events || [];
      } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        // Return empty array instead of crashing
        return [];
      }
    }
  }
  
  // Export a singleton instance
  export const clientGoogleCalendarService = new ClientGoogleCalendarService();
  