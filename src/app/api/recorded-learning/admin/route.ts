import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';
import { verifyStaff } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { validLearningId } from '@/lib/server/recorded-learning';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const collection=()=>adminDb!.collection('recorded_learning_items');
export async function GET(request:Request){
  const auth=await verifyStaff(request);if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status,headers});
  try{const docs=await collection().get();return NextResponse.json({items:docs.docs.map(doc=>({...doc.data(),id:doc.id})).sort((a,b)=>Number((a as {order?:number}).order||0)-Number((b as {order?:number}).order||0))},{headers});}
  catch{return NextResponse.json({error:'Could not load shared content.'},{status:500,headers});}
}
export async function POST(request:Request){
  const auth=await verifyStaff(request);if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status,headers});
  try{
    if(request.headers.get('content-type')?.includes('multipart/form-data')){
      if(Number(request.headers.get('content-length'))>4*1024*1024+20000)return NextResponse.json({error:'Upload files up to 4 MB. For larger existing documents, paste the Firebase Storage path.'},{status:413,headers});
      const form=await request.formData(),file=form.get('file');
      if(!(file instanceof File)||file.size===0||file.size>4*1024*1024||! /\.(pdf|docx?|pptx?|xlsx?|zip)$/i.test(file.name))return NextResponse.json({error:'Use a PDF, Office document or ZIP, up to 4 MB.'},{status:400,headers});
      const path=`recorded-learning/documents/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
      await getStorage().bucket(firebaseConfig.storageBucket).file(path).save(Buffer.from(await file.arrayBuffer()),{resumable:false,metadata:{contentType:file.type||'application/octet-stream',cacheControl:'private, no-store'}});
      return NextResponse.json({storagePath:path},{headers});
    }
    const body=await request.json();
    const id=body.id?String(body.id):null;
    if(id&&!validLearningId(id))return NextResponse.json({error:'Invalid item.'},{status:400,headers});
    const title=String(body.title||'').trim(),kind=body.kind,exam=body.exam,packageId=String(body.packageId||'');
    if(!title||title.length>200||!['video','document'].includes(kind)||!['pte','ielts','both'].includes(exam)|| (packageId&&!validLearningId(packageId)))return NextResponse.json({error:'Check the title, exam and package selection.'},{status:400,headers});
    let storagePath=String(body.storagePath||'').trim();
    if(storagePath.startsWith('gs://')){
      const prefix=`gs://${firebaseConfig.storageBucket}/`;if(!storagePath.startsWith(prefix))return NextResponse.json({error:'Use a file in this website’s Firebase Storage bucket.'},{status:400,headers});storagePath=storagePath.slice(prefix.length);
    }
    if(storagePath.startsWith('https://')){
      const url=new URL(storagePath),prefix=`/v0/b/${firebaseConfig.storageBucket}/o/`;
      if(url.hostname!=='firebasestorage.googleapis.com'||!url.pathname.startsWith(prefix))return NextResponse.json({error:'Use a Firebase Storage file from this website’s bucket.'},{status:400,headers});storagePath=decodeURIComponent(url.pathname.slice(prefix.length));
    }
    if(kind==='video'&&(!/^\d+$/.test(String(body.bunnyLibraryId))||! /^[a-f\d-]{8,}$/i.test(String(body.bunnyVideoId))))return NextResponse.json({error:'Paste a valid Bunny Stream embed link.'},{status:400,headers});
    if(kind==='document'){
      if(!storagePath||storagePath.includes('..')||storagePath.startsWith('/')||/^(identity-docs|speaking-answers)\//.test(storagePath)||! /\.(pdf|docx?|pptx?|xlsx?|zip)$/i.test(storagePath))return NextResponse.json({error:'Enter a valid learning-document Storage path.'},{status:400,headers});
      const [exists]=await getStorage().bucket(firebaseConfig.storageBucket).file(storagePath).exists();
      if(!exists)return NextResponse.json({error:'That file was not found in Firebase Storage.'},{status:400,headers});
    }
    const data={title,kind,exam,packageId,group:kind==='video'?'grammar':'resources',published:body.published===true,description:String(body.description||'').slice(0,2000),duration:String(body.duration||'').slice(0,60),order:Number(body.order)||0,
      bunnyLibraryId:kind==='video'?String(body.bunnyLibraryId):'',bunnyVideoId:kind==='video'?String(body.bunnyVideoId):'',storagePath:kind==='document'?storagePath:'',updatedAt:new Date()};
    const ref=id?collection().doc(id):collection().doc();await ref.set(data,{merge:true});return NextResponse.json({id:ref.id},{headers});
  }catch{return NextResponse.json({error:'Could not save this content. Check the fields and try again.'},{status:500,headers});}
}
export async function DELETE(request:Request){
  const auth=await verifyStaff(request);if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status,headers});
  try{const id=new URL(request.url).searchParams.get('id')||'';if(!validLearningId(id))return NextResponse.json({error:'Invalid item.'},{status:400,headers});await collection().doc(id).update({published:false,updatedAt:new Date()});return NextResponse.json({ok:true},{headers});}
  catch{return NextResponse.json({error:'Could not archive this item.'},{status:500,headers});}
}
