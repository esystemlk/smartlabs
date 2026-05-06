import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const secret = searchParams.get('secret');

  const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const CRON_SECRET = process.env.CRON_SECRET;

  // 1. Try to get cached data from Firestore
  if (adminDb && !forceRefresh) {
    try {
      const cacheRef = adminDb.collection('site_settings').doc('google_reviews');
      const doc = await cacheRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        const lastUpdated = data?.lastUpdated?.toDate();
        const now = new Date();
        
        // Define today's 6 PM target
        const today6PM = new Date(now);
        today6PM.setHours(18, 0, 0, 0);

        // Logic for auto-refresh:
        // If it's currently after 6 PM, and the last update was BEFORE today's 6 PM, we need new data.
        const isAfter6PM = now >= today6PM;
        const lastUpdateBeforeTarget = lastUpdated < today6PM;
        
        if (!(isAfter6PM && lastUpdateBeforeTarget)) {
          // If we DON'T need an auto-refresh, check if cache is generally still valid (e.g. within 24h)
          // This handles visits before 6 PM using yesterday's data.
          if (lastUpdated && (now.getTime() - lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
            return NextResponse.json(data.result);
          }
        }
        // If we reach here, either it's after 6 PM and we haven't updated today, 
        // or the cache is older than 24h anyway. Proceed to fetch from Google.
      }
    } catch (error) {
      console.error('Firestore cache read error:', error);
    }
  }

  // 2. If we need to refresh (force, old cache, or no cache)
  if (!PLACE_ID || !API_KEY) {
    return NextResponse.json({ 
      error: 'Missing API credentials', 
      reviews: [], 
      rating: 0, 
      user_ratings_total: 0 
    }, { status: 200 });
  }

  // If force refresh is requested with secret, or we just need new data
  if (forceRefresh && CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,reviews&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || 'Google API error', status: data.status }, { status: 400 });
    }

    // 3. Save to Firestore cache
    if (adminDb) {
      try {
        await adminDb.collection('site_settings').doc('google_reviews').set({
          result: data.result,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Firestore cache write error:', error);
      }
    }

    return NextResponse.json(data.result);
  } catch (error) {
    console.error('Proxy error fetching Google reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
