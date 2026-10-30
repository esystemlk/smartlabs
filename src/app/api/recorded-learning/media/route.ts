import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';
import { verifyAuthed } from '@/lib/api-auth';
import { learningPackage, learningItems, learningEmbedUrl, validLearningId } from '@/lib/server/recorded-learning';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request) {
  const auth=await verifyAuthed(request);
  if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status,headers});
  try {
    const query=new URL(request.url).searchParams,id=query.get('packageId')||'',itemId=query.get('itemId');
    if(!validLearningId(id))return NextResponse.json({error:'Package not found.'},{status:404,headers});
    const access=await learningPackage(id,auth.uid,auth.role);
    if(!access?.allowed)return NextResponse.json({error:'Active package access is required. Please purchase or renew this package.'},{status:403,headers});
    const item=(await learningItems(access.pkg)).find(item=>item.id===itemId);
    if(!item)return NextResponse.json({error:'This lesson or document is no longer available.'},{status:404,headers});
    if(item.kind==='video')return NextResponse.json({url:learningEmbedUrl(item.bunnyLibraryId||'',item.bunnyVideoId||'',access.staff?0:access.expiresAt),kind:'video'},{headers});
    const file=getStorage().bucket(firebaseConfig.storageBucket).file(item.storagePath||'');
    const [exists]=await file.exists();
    if(!exists)return NextResponse.json({error:'This document is unavailable. Please contact SmartLabs.'},{status:404,headers});
    const expires=Math.min(Date.now()+5*60*1000,access.staff?Infinity:access.expiresAt);
    const extension=(item.storagePath||'').split('.').pop()||'pdf';
    const filename=item.title.replace(/[^a-zA-Z0-9 ._-]/g,'_');
    const [url]=await file.getSignedUrl({version:'v4',action:'read',expires,responseDisposition:`attachment; filename="${filename.toLowerCase().endsWith('.'+extension.toLowerCase())?filename:filename+'.'+extension}"`});
    return NextResponse.json({url,kind:'document'},{headers});
  }catch{return NextResponse.json({error:'Could not open this content. Please retry or contact SmartLabs.'},{status:500,headers});}
}
