import { NextResponse } from 'next/server';

export async function GET() {
  const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!PLACE_ID || !API_KEY) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,reviews&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || 'Google API error', status: data.status }, { status: 400 });
    }

    return NextResponse.json(data.result);
  } catch (error) {
    console.error('Proxy error fetching Google reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
