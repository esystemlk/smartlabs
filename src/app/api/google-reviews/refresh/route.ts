import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;

  // Fail CLOSED. The old check was `if (CRON_SECRET && ...)`, so a missing
  // env var skipped authentication entirely and left this endpoint public.
  if (!CRON_SECRET) {
    console.error('[google-reviews/refresh] CRON_SECRET is not set — refusing.');
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  // Prefer the header: a secret in the query string ends up in server,
  // proxy and browser-history logs. The query form still works for the
  // existing cron job that calls it.
  const { searchParams } = new URL(request.url);
  const provided =
    request.headers.get('x-cron-secret') ?? searchParams.get('secret') ?? '';

  if (provided !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Construct the internal/external URL to hit the main reviews API with refresh=true
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const refreshUrl = `${baseUrl}/api/google-reviews?refresh=true`;

    // Header, not query string, so the secret stays out of access logs.
    const response = await fetch(refreshUrl, {
      headers: { 'x-cron-secret': CRON_SECRET },
      cache: 'no-store',
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Upstream refresh failed', status: response.status },
        { status: 502 }
      );
    }

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
