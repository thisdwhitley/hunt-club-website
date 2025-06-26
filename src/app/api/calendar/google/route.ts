// src/app/api/calendar/google/route.ts (Final clean version)
import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Check if Google Calendar is configured
    if (!process.env.GOOGLE_CALENDAR_API_KEY) {
      return NextResponse.json([]);
    }

    // Define multiple calendar sources (only working ones)
    const calendars = [
      // Club calendar
      process.env.GOOGLE_CALENDAR_ID && {
        id: process.env.GOOGLE_CALENDAR_ID,
        name: 'Club Calendar'
      },
      // US Holidays calendar
      process.env.GOOGLE_CALENDAR_HOLIDAYS_ID && {
        id: process.env.GOOGLE_CALENDAR_HOLIDAYS_ID,
        name: 'Holidays'
      },
      // Additional working calendars (moon phases, etc.)
      process.env.GOOGLE_CALENDAR_ID_2 && {
        id: process.env.GOOGLE_CALENDAR_ID_2,
        name: 'Additional Calendar'
      }
    ].filter(Boolean) as Array<{id: string, name: string}>;

    if (calendars.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch events from all configured calendars
    const events = await googleCalendarService.getMultipleCalendarEvents(
      calendars,
      start,
      end
    );

    return NextResponse.json(events);
    
  } catch (error: any) {
    console.error('Error in Google Calendar API route:', error);
    return NextResponse.json([]);
  }
}
