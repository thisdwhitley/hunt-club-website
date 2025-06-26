// src/app/api/calendar/google-direct/route.ts (Direct fetch test)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || '2025-06-01';
    const end = searchParams.get('end') || '2025-06-30';

    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!apiKey || !calendarId) {
      return NextResponse.json({
        error: 'Missing configuration',
        apiKey: !!apiKey,
        calendarId: !!calendarId
      }, { status: 400 });
    }

    console.log('\n=== Direct Fetch Test ===');
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('Calendar ID:', calendarId);

    // Try multiple calendar ID formats
    const calendarFormats = [
      calendarId, // Original from env
      decodeURIComponent(calendarId), // Decoded
      'en.usa%23holiday%40group.v.calendar.google.com', // Known working encoded
      'en.usa#holiday@group.v.calendar.google.com' // Known working decoded
    ];

    for (const testCalendarId of calendarFormats) {
      console.log(`\nTrying calendar ID: ${testCalendarId}`);
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(testCalendarId)}/events?key=${apiKey}&timeMin=${start}T00:00:00Z&timeMax=${end}T23:59:59Z&maxResults=10&singleEvents=true&orderBy=startTime`;
      
      console.log(`Request URL: ${url}`);
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          console.log(`✅ Success! Found ${data.items?.length || 0} events`);
          
          const events = (data.items || []).map((event: any) => ({
            id: event.id,
            title: event.summary || 'Untitled Event',
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            description: event.description || '',
            location: event.location || '',
            isAllDay: !event.start?.dateTime,
            isPublic: event.visibility !== 'private',
            source: 'google',
          }));

          return NextResponse.json({
            success: true,
            method: 'Direct fetch',
            calendarId: testCalendarId,
            events,
            eventsCount: events.length,
            url
          });
        } else {
          console.log(`❌ Failed: ${data.error?.message || 'Unknown error'}`);
        }
      } catch (fetchError: any) {
        console.log(`❌ Fetch error: ${fetchError.message}`);
      }
    }

    return NextResponse.json({
      error: 'All calendar ID formats failed',
      tested: calendarFormats
    }, { status: 500 });

  } catch (error: any) {
    console.error('Direct fetch test error:', error);
    return NextResponse.json({
      error: 'Direct fetch test failed',
      message: error.message
    }, { status: 500 });
  }
}
