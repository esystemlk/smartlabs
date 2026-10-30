import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getLmsDb } from '@/lib/lms-admin';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['admin', 'developer', 'teacher'];

/**
 * List videos from the Bunny Stream library (the real recordings), so an admin
 * can pick which to add to a recorded package. Reads the Bunny API key + library
 * id + CDN hostname from the LMS `settings/general` doc (via the LMS connection),
 * then proxies the Bunny Stream API. Admin-only.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const role = (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
    if (!ADMIN_ROLES.includes(role)) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

    const directLibrary = process.env.BUNNY_STREAM_LIBRARY_ID;
    const directKey = process.env.BUNNY_STREAM_API_KEY;
    const lmsDb = directLibrary && directKey ? undefined : getLmsDb();
    const settings = lmsDb ? (await lmsDb.collection('settings').doc('general').get()).data() || {} : {};
    const libraryId = String(directLibrary || settings.bunnyLibraryId || '');
    const apiKey = String(directKey || settings.bunnyApiKey || '');
    const cdnHost = String(process.env.BUNNY_STREAM_CDN_HOSTNAME || settings.bunnyCdnHostname || (libraryId ? `vz-${libraryId}.b-cdn.net` : ''));
    if (!libraryId || !apiKey) return NextResponse.json({ error: 'The video picker needs Bunny Stream library/API configuration or the LMS connection. You can still paste Bunny embed links to add videos.' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const perPage = Math.min(100, Number(searchParams.get('perPage')) || 40);
    const search = searchParams.get('search') || '';

    const bunnyUrl = new URL(`https://video.bunnycdn.com/library/${libraryId}/videos`);
    bunnyUrl.searchParams.set('page', String(page));
    bunnyUrl.searchParams.set('itemsPerPage', String(perPage));
    bunnyUrl.searchParams.set('orderBy', 'date');
    if (search) bunnyUrl.searchParams.set('search', search);

    const res = await fetch(bunnyUrl.toString(), { headers: { AccessKey: apiKey, accept: 'application/json' } });
    if (!res.ok) {
      return NextResponse.json({ error: `Bunny API error (${res.status}).` }, { status: 502 });
    }
    const data = await res.json();

    const videos = (data.items || []).map((v: Record<string, unknown>) => {
      const guid = String(v.guid || '');
      const thumbFile = String(v.thumbnailFileName || 'thumbnail.jpg');
      return {
        videoId: guid,
        libraryId,
        title: String(v.title || 'Untitled'),
        durationSeconds: Number(v.length) || 0,
        status: Number(v.status), // 4 = finished
        dateUploaded: v.dateUploaded ? String(v.dateUploaded) : '',
        views: Number(v.views) || 0,
        thumbnailUrl: cdnHost && guid ? `https://${cdnHost}/${guid}/${thumbFile}` : '',
      };
    });

    return NextResponse.json({
      videos,
      libraryId,
      page: Number(data.currentPage) || page,
      perPage,
      totalItems: Number(data.totalItems) || videos.length,
    });
  } catch (error) {
    console.error('[recorded-packages/bunny-videos]', error);
    return NextResponse.json({ error: 'Failed to load Bunny videos.' }, { status: 500 });
  }
}
