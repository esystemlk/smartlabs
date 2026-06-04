import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google Cloud Text-to-Speech proxy.
 * Returns base64 MP3 so the client can play it from a same-origin data: URL
 * (required for the Web Audio AnalyserNode lip-sync to read samples).
 *
 * Setup: enable "Cloud Text-to-Speech API" in GCP and set GOOGLE_CLOUD_TTS_API_KEY.
 */
export async function POST(request: Request) {
  try {
    // ── Auth (protects the paid key) ──
    if (!adminAuth) {
      return Response.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    try {
      await adminAuth.verifyIdToken(authHeader.slice(7));
    } catch {
      return Response.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'TTS not configured.' }, { status: 500 });
    }

    const { text, voice } = (await request.json()) as { text?: string; voice?: string };
    if (!text || !text.trim()) {
      return Response.json({ error: 'text is required.' }, { status: 400 });
    }
    // Cap length to control cost / latency.
    const clipped = text.slice(0, 800);

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: clipped },
          voice: { languageCode: 'en-US', name: voice ?? 'en-US-Neural2-F' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[tts] Cloud TTS error:', res.status, detail);
      return Response.json({ error: 'TTS request failed.' }, { status: 502 });
    }

    const data = await res.json();
    // data.audioContent is base64 MP3
    return Response.json({ audio: data.audioContent as string });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tts] error:', error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
