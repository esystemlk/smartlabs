import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { EXISTING_LEARNERS } from '@/lib/student-community';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getCommunityCount = unstable_cache(async () => {
  if (!adminDb) throw new Error('Database unavailable');
  const users = adminDb.collection('users');
  // Include legacy profiles without a role; exclude staff accounts.
  const [all, staff] = await Promise.all([
    users.count().get(),
    users.where('role', 'in', ['admin', 'developer', 'teacher']).count().get(),
  ]);
  const registeredStudents = Math.max(0, all.data().count - staff.data().count);
  return { existingLearners: EXISTING_LEARNERS, registeredStudents, total: EXISTING_LEARNERS + registeredStudents };
}, ['student-community-count-v1'], { revalidate: 60 });

export async function GET() {
  try {
    return NextResponse.json(await getCommunityCount(), { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
  } catch {
    // Do not present an invented registration count if the database cannot be read.
    return NextResponse.json({ existingLearners: EXISTING_LEARNERS, registeredStudents: null, total: EXISTING_LEARNERS }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
