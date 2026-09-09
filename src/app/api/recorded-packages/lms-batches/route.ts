import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getLmsDb } from '@/lib/lms-admin';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['admin', 'developer', 'teacher'];

interface LmsRecording { title: string; bunnyLibraryId: string; bunnyVideoId: string; date?: string; duration?: string }
interface LmsBatchOut {
  courseId: string; courseTitle: string;
  batchId: string; batchName: string; startDate?: string; endDate?: string; status?: string;
  recordings: LmsRecording[];
}
interface BunnyVideo { guid: string; title: string; recDate: string | null; recTime: string; length: number }

/** Resolve an LMS videoUrl (full link, "lib/guid", or bare GUID) to Bunny ids. */
function resolveBunnyRef(videoUrl: string, defaultLibraryId: string): { bunnyLibraryId: string; bunnyVideoId: string } | null {
  const s = String(videoUrl || '').trim();
  if (!s) return null;
  const m = s.match(/(?:embed|play)\/(\d+)\/([0-9a-fA-F-]{8,})/) || s.match(/^(\d+)\s*\/\s*([0-9a-fA-F-]{8,})$/);
  if (m) return { bunnyLibraryId: m[1], bunnyVideoId: m[2] };
  if (/^[0-9a-fA-F-]{8,}$/.test(s) && defaultLibraryId) return { bunnyLibraryId: defaultLibraryId, bunnyVideoId: s };
  return null;
}

/** Zoom recordings are named GMT{YYYYMMDD}-{HHMMSS}_Recording — the real class time. */
function parseGmt(title: string): { date: string; time: string } | null {
  const m = String(title || '').match(/GMT(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/);
  if (!m) {
    const d = String(title || '').match(/GMT(\d{4})(\d{2})(\d{2})/);
    return d ? { date: `${d[1]}-${d[2]}-${d[3]}`, time: '' } : null;
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

/** A clean class title from a Zoom auto-name, else the original title. */
function classTitle(title: string): string {
  const g = parseGmt(title);
  if (!g) return String(title || 'Class');
  const dt = new Date(`${g.date}T${g.time || '00:00'}:00Z`);
  const nice = isNaN(dt.getTime()) ? g.date : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return g.time ? `${nice} · ${g.time}` : nice;
}

function fmtDuration(seconds: number): string {
  const s = Math.round(seconds || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return '';
}

/** Fetch every video in the Bunny library (all pages). */
async function fetchAllBunnyVideos(libraryId: string, apiKey: string): Promise<BunnyVideo[]> {
  const out: BunnyVideo[] = [];
  const perPage = 100;
  for (let page = 1; page <= 20; page++) {
    const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=${perPage}&orderBy=date`;
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, { headers: { AccessKey: apiKey, accept: 'application/json' } });
    if (!res.ok) break;
    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();
    const items = data.items || [];
    for (const v of items) {
      const g = parseGmt(String(v.title || ''));
      out.push({ guid: String(v.guid || ''), title: String(v.title || ''), recDate: g ? g.date : null, recTime: g ? g.time : '', length: Number(v.length) || 0 });
    }
    if (items.length < perPage || out.length >= (Number(data.totalItems) || 0)) break;
  }
  return out;
}

/**
 * List LMS batches with their recordings. Recordings are pulled AUTOMATICALLY
 * from the Bunny library by matching each video's recording date (parsed from
 * the Zoom title) to the batch's [startDate, endDate] window, merged with any
 * videos manually linked to the batch (recordedClasses). Admin-only, read-only.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const role = (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
    if (!ADMIN_ROLES.includes(role)) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

    const lmsDb = getLmsDb();
    if (!lmsDb) return NextResponse.json({ error: 'LMS connection not configured. Set LMS_ADMIN_CONFIG on the server.' }, { status: 503 });

    const settings = (await lmsDb.collection('settings').doc('general').get()).data() || {};
    const libraryId = String(settings.bunnyLibraryId || '');
    const apiKey = String(settings.bunnyApiKey || '');

    // Pull the whole Bunny library once (best-effort; fall back to linked-only).
    let bunnyVideos: BunnyVideo[] = [];
    if (libraryId && apiKey) {
      try { bunnyVideos = await fetchAllBunnyVideos(libraryId, apiKey); } catch { /* fall back */ }
    }

    const coursesSnap = await lmsDb.collection('courses').get();
    const batches: LmsBatchOut[] = [];

    for (const courseDoc of coursesSnap.docs) {
      const course = courseDoc.data();
      const courseTitle = (course.title as string) || 'Course';
      const batchesSnap = await courseDoc.ref.collection('batches').get();
      for (const b of batchesSnap.docs) {
        const batch = b.data();
        const startDate = batch.startDate ? String(batch.startDate) : '';
        const endDate = batch.endDate ? String(batch.endDate) : '';

        const seen = new Set<string>();
        const recordings: LmsRecording[] = [];

        // 1. Auto-match Bunny videos by recording date within the batch window.
        if (libraryId && startDate && endDate) {
          bunnyVideos
            .filter((v) => v.recDate && v.recDate >= startDate && v.recDate <= endDate)
            .sort((a, b2) => (a.recDate! + a.recTime).localeCompare(b2.recDate! + b2.recTime))
            .forEach((v) => {
              if (!v.guid || seen.has(v.guid)) return;
              seen.add(v.guid);
              recordings.push({ title: classTitle(v.title), bunnyLibraryId: libraryId, bunnyVideoId: v.guid, date: v.recDate!, duration: fmtDuration(v.length) });
            });
        }

        // 2. Merge any manually-linked recordings (recordedClasses), de-duped.
        const rc = Array.isArray(batch.recordedClasses) ? batch.recordedClasses : [];
        for (const r of rc) {
          const ref = resolveBunnyRef(String((r as Record<string, unknown>).videoUrl || ''), libraryId);
          if (!ref || seen.has(ref.bunnyVideoId)) continue;
          seen.add(ref.bunnyVideoId);
          recordings.push({ title: String((r as Record<string, unknown>).title || 'Class'), bunnyLibraryId: ref.bunnyLibraryId, bunnyVideoId: ref.bunnyVideoId });
        }

        batches.push({
          courseId: courseDoc.id, courseTitle,
          batchId: b.id, batchName: (batch.name as string) || 'Batch',
          startDate, endDate, status: (batch.status as string) || undefined,
          recordings,
        });
      }
    }

    batches.sort((a, b) => (b.recordings.length - a.recordings.length) || a.batchName.localeCompare(b.batchName));
    return NextResponse.json({ batches, bunnyMatched: bunnyVideos.length > 0 });
  } catch (error) {
    console.error('[recorded-packages/lms-batches]', error);
    return NextResponse.json({ error: 'Failed to load LMS batches.' }, { status: 500 });
  }
}
