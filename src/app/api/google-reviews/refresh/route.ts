import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Basic security check for cron job
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Construct the internal/external URL to hit the main reviews API with refresh=true
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const refreshUrl = `${baseUrl}/api/google-reviews?refresh=true&secret=${CRON_SECRET || ''}`;
    
    const response = await fetch(refreshUrl);
    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Reviews cache refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh reviews' }, { status: 500 });
  }
}
