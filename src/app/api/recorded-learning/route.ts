import { NextResponse } from 'next/server';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { timestampMillis } from '@/lib/recorded-learning';
import { learningItems, learningPackage, safeLearningItem, validLearningId } from '@/lib/server/recorded-learning';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  try {
    if (!adminDb) return NextResponse.json({error:'Learning library is temporarily unavailable.'},{status:503,headers});
    const auth = request.headers.has('Authorization') ? await verifyAuthed(request) : null;
    if (auth && !auth.ok) return NextResponse.json({error:auth.error},{status:auth.status,headers});
    const uid = auth?.ok ? auth.uid : undefined, role = auth?.ok ? auth.role : undefined;
    const id = new URL(request.url).searchParams.get('packageId');
    if (id) {
      if (!validLearningId(id)) return NextResponse.json({error:'Package not found.'},{status:404,headers});
      const access = await learningPackage(id, uid, role);
      if (!access) return NextResponse.json({error:'Package not found.'},{status:404,headers});
      const items = await learningItems(access.pkg);
      const progress = uid && access.allowed ? (await adminDb.collection('users').doc(uid).collection('recorded_progress').doc(id).get()).data() : null;
      return NextResponse.json({pkg:access.pkg,allowed:access.allowed,owned:access.owned,expiresAt:access.staff&&!access.owned?0:access.expiresAt,items:items.map(safeLearningItem),progress:progress || {completed:[],lastItemId:null}},{headers});
    }
    const [packages,enrollments] = await Promise.all([
      adminDb.collection('recorded_packages').get(),
      uid ? adminDb.collection('recorded_enrollments').where('userId','==',uid).get() : null,
    ]);
    const owned = new Map((enrollments?.docs || []).map(doc => [doc.data().packageId,doc.data()]));
    const rows = await Promise.all(packages.docs.filter(doc => doc.data().published !== false || owned.has(doc.id)).map(async doc => {
      const pkg = {...doc.data(),id:doc.id} as Parameters<typeof learningItems>[0];
      const items = await learningItems(pkg);
      const enrollment = owned.get(doc.id);
      const expiresAt = timestampMillis(enrollment?.expiresAt);
      const progress = uid ? (await adminDb!.collection('users').doc(uid).collection('recorded_progress').doc(doc.id).get()).data() : null;
      const videos = items.filter(item=>item.kind==='video');
      return {pkg,videoCount:videos.length,grammarCount:items.filter(item=>item.group==='grammar').length,resourceCount:items.filter(item=>item.kind==='document').length,
        owned:enrollment?.status==='active' && expiresAt>Date.now(),expiresAt,
        completedCount:videos.filter(item=>(progress?.completed || []).includes(item.id)).length};
    }));
    rows.sort((a,b)=>(b.pkg.order || 0)-(a.pkg.order || 0));
    return NextResponse.json({packages:rows},{headers});
  } catch { return NextResponse.json({error:'Could not load recorded learning. Please try again.'},{status:500,headers}); }
}
