import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { learningPackage, learningItems, validLearningId } from '@/lib/server/recorded-learning';
export const runtime='nodejs';
export async function PATCH(request:Request){
  const auth=await verifyAuthed(request);if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
  try{
    const {packageId,itemId,completed}=await request.json();
    if(!validLearningId(String(packageId||'')))return NextResponse.json({error:'Invalid package.'},{status:400});
    const access=await learningPackage(packageId,auth.uid,auth.role);
    if(!access?.allowed)return NextResponse.json({error:'Your package access has ended. Renew to continue.'},{status:403});
    const item=(await learningItems(access.pkg)).find(item=>item.id===itemId && item.kind==='video');
    if(!item)return NextResponse.json({error:'Lesson not found.'},{status:404});
    await adminDb!.collection('users').doc(auth.uid).collection('recorded_progress').doc(packageId).set({
      lastItemId:itemId,updatedAt:FieldValue.serverTimestamp(),
      ...(typeof completed==='boolean'?{completed:completed?FieldValue.arrayUnion(itemId):FieldValue.arrayRemove(itemId)}:{}),
    },{merge:true});
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Progress could not be saved. Please retry.'},{status:500});}
}
