import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getLmsDb } from '@/lib/lms-admin';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['admin', 'developer', 'teacher'];

interface LmsRecording { title: string; bunnyLibraryId: string; bunnyVideoId: string; date?: string; order?: number }

/** Resolve an LMS videoUrl (full link, "lib/guid", or bare GUID) to Bunny ids. */
function resolveBunnyRef(videoUrl: string, defaultLibraryId: string): { bunnyLibraryId: string; bunnyVideoId: string } | null {
  const s = String(videoUrl || '').trim();
  if (!s) return null;
  const m = s.match(/(?:embed|play)\/(\d+)\/([0-9a-fA-F-]{8,})/) || s.match(/^(\d+)\s*\/\s*([0-9a-fA-F-]{8,})$/);
  if (m) return { bunnyLibraryId: m[1], bunnyVideoId: m[2] };
  if (/^[0-9a-fA-F-]{8,}$/.test(s) && defaultLibraryId) return { bunnyLibraryId: defaultLibraryId, bunnyVideoId: s };
  return null;
}
interface LmsBatchOut {
  courseId: string; courseTitle: string;
  batchId: string; batchName: string; startDate?: string; status?: string;
  recordings: LmsRecording[];
}

/**
 * List LMS batches (with their recorded classes) so the main-site admin can
 * pick which ones to publish as recorded packages. Admin-only, read-only.
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
    if (!lmsDb) {
      return NextResponse.json({ error: 'LMS connection not configured. Set LMS_ADMIN_CONFIG on the server.' }, { status: 503 });
    }

    // Global Bunny library id (bare-GUID recordings combine with this).
    let defaultLibraryId = '';
    try {
      const settings = (await lmsDb.collection('settings').doc('general').get()).data();
      defaultLibraryId = String(settings?.bunnyLibraryId || settings?.bunny?.libraryId || '');
    } catch { /* optional */ }

    const coursesSnap = await lmsDb.collection('courses').get();
    const batches: LmsBatchOut[] = [];

    for (const courseDoc of coursesSnap.docs) {
      const course = courseDoc.data();
      const courseTitle = (course.title as string) || 'Course';
      const batchesSnap = await courseDoc.ref.collection('batches').get();
      for (const b of batchesSnap.docs) {
        const batch = b.data();
        const rc = Array.isArray(batch.recordedClasses) ? batch.recordedClasses : [];
        const recordings: LmsRecording[] = rc
          .map((r: Record<string, unknown>) => {
            const ref = resolveBunnyRef(String(r.videoUrl || ''), defaultLibraryId);
            if (!ref) return null;
            return {
              title: String(r.title || 'Class'),
              bunnyLibraryId: ref.bunnyLibraryId,
              bunnyVideoId: ref.bunnyVideoId,
              date: r.date ? String(r.date) : undefined,
              order: typeof r.order === 'number' ? r.order : undefined,
            } as LmsRecording;
          })
          .filter((r): r is LmsRecording => r !== null);
        batches.push({
          courseId: courseDoc.id,
          courseTitle,
          batchId: b.id,
          batchName: (batch.name as string) || 'Batch',
          startDate: batch.startDate ? String(batch.startDate) : undefined,
          status: (batch.status as string) || undefined,
          recordings,
        });
      }
    }

    // Batches with recordings first, then by name.
    batches.sort((a, b) => (b.recordings.length - a.recordings.length) || a.batchName.localeCompare(b.batchName));
    return NextResponse.json({ batches });
  } catch (error) {
    console.error('[recorded-packages/lms-batches]', error);
    return NextResponse.json({ error: 'Failed to load LMS batches.' }, { status: 500 });
  }
}
