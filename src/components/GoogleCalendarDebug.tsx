// src/app/api/calendar/google/route.ts (Enhanced with debugging)
import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const debug = searchParams.get('debug') === 'true';

    // Debug mode - test configuration
    if (debug) {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
          apiKeyPresent: !!process.env.GOOGLE_CALENDAR_API_KEY,
          apiKeyLength: process.env.GOOGLE_CALENDAR_API_KEY?.length || 0,
          calendarId1: process.env.GOOGLE_CALENDAR_ID || 'Not set',
          calendarId2: process.env.GOOGLE_CALENDAR_ID_2 || 'Not set',
          calendarId3: process.env.GOOGLE_CALENDAR_ID_3 || 'Not set',
        },
        tests: {
          apiKey: null as any,
          calendars: [] as any[]
        }
      };

      // Test API key
      debugInfo.tests.apiKey = await googleCalendarService.testApiKey();

      // Test each calendar ID
      const calendarIds = [
        process.env.GOOGLE_CALENDAR_ID,
        process.env.GOOGLE_CALENDAR_ID_2,
        process.env.GOOGLE_CALENDAR_ID_3,
      ].filter(Boolean) as string[];

      for (const calendarId of calendarIds) {
        const test = await googleCalendarService.testCalendarAccess(calendarId);
        debugInfo.tests.calendars.push({
          calendarId,
          ...test
        });
      }

      return NextResponse.json(debugInfo);
    }

    // Normal operation
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Check if Google Calendar is configured
    if (!process.env.GOOGLE_CALENDAR_API_KEY) {
      console.log('Google Calendar API key not configured, returning empty array');
      return NextResponse.json([]);
    }

    // Get calendar IDs from environment variables
    const calendarIds = [
      process.env.GOOGLE_CALENDAR_ID,
      process.env.GOOGLE_CALENDAR_ID_2,
      process.env.GOOGLE_CALENDAR_ID_3,
    ].filter(Boolean) as string[];

    if (calendarIds.length === 0) {
      console.log('No calendar IDs configured, returning empty array');
      return NextResponse.json([]);
    }

    console.log(`\n=== Google Calendar Request ===`);
    console.log(`Date range: ${start} to ${end}`);
    console.log(`Calendar IDs: ${calendarIds.join(', ')}`);
    console.log(`API Key present: ${!!process.env.GOOGLE_CALENDAR_API_KEY}`);
    console.log(`API Key length: ${process.env.GOOGLE_CALENDAR_API_KEY?.length || 0}`);

    // Fetch events from all configured calendars
    const events = await googleCalendarService.getMultipleCalendarEvents(
      calendarIds,
      start,
      end
    );

    console.log(`\n=== Response ===`);
    console.log(`Total events retrieved: ${events.length}`);
    console.log(`Events: ${JSON.stringify(events, null, 2)}`);
    console.log(`=== End ===\n`);

    return NextResponse.json(events);
    
  } catch (error: any) {
    console.error('Error in Google Calendar API route:', error);
    console.error('Error stack:', error.stack);
    
    // Return detailed error in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return NextResponse.json({ 
        error: 'Google Calendar API Error',
        details: error.message,
        code: error.code,
        stack: error.stack
      }, { status: 500 });
    }
    
    // Return empty array in production to prevent UI crashes
    return NextResponse.json([]);
  }
}
