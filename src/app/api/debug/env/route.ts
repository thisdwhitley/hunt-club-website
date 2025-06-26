// src/app/api/debug/env/route.ts (Temporary debugging endpoint)
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    
    // Debug info (safe for development)
    const debugInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      
      // Environment variable checks
      apiKey: {
        present: !!apiKey,
        type: typeof apiKey,
        length: apiKey?.length || 0,
        firstTen: apiKey?.substring(0, 10) || 'N/A',
        lastTen: apiKey?.substring(apiKey.length - 10) || 'N/A',
        isExpected: apiKey === 'AIzaSyAqEkf3Mv3POnCt3lZ6dQ69V0DXLukQEcc'
      },
      
      // All Google-related env vars
      googleEnvVars: Object.keys(process.env)
        .filter(key => key.includes('GOOGLE'))
        .reduce((acc, key) => {
          const value = process.env[key];
          acc[key] = {
            present: !!value,
            length: value?.length || 0,
            firstTen: value?.substring(0, 10) || 'N/A'
          };
          return acc;
        }, {} as any),
      
      // Process info
      platform: process.platform,
      cwd: process.cwd(),
      
      // Total env var count (to see if any are loaded)
      totalEnvVars: Object.keys(process.env).length,
      
      // Sample of other env vars (to verify env loading works)
      otherEnvVars: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      }
    };

    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
