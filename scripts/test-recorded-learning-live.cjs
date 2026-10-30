// Local integration only. Creates hidden fixture content and disposable accounts, then removes it.
const assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
async function main(){
  if(!process.argv.includes('--run'))throw new Error('Pass --run to use disposable Firebase fixtures against localhost:9031.');
  require('@next/env').loadEnvConfig(process.cwd());const admin=require('firebase-admin');
  const configText=fs.readFileSync('src/firebase/config.ts','utf8'),config=JSON.parse(configText.slice(configText.indexOf('{'),configText.lastIndexOf('}')+1));
  const app=admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CONFIG))},'recorded-learning-smoke'),db=app.firestore(),auth=app.auth(),bucket=app.storage().bucket(config.storageBucket);
  const users=[],tokens=[],testId='codex-recorded-smoke-'+randomUUID(),refs=[],files=[];
  const api=async(path='',token,method='GET',body)=>fetch('http://127.0.0.1:9031/api/recorded-learning'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  const fixture=async(collection,id,data)=>{const ref=db.collection(collection).doc(id);refs.push(ref);await ref.set(data)};
  try{
    for(let index=0;index<3;index++){
      const uid='codex-recorded-smoke-'+randomUUID();await auth.createUser({uid});users.push(uid);await db.collection('users').doc(uid).set({role:index===2?'teacher':'student'});
      const custom=await auth.createCustomToken(uid);const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key='+config.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});const data=await response.json();if(!data.idToken)throw new Error('Could not establish test session.');tokens.push(data.idToken);
    }
    await fixture('recorded_packages',testId,{title:'Disposable recorded-learning fixture',exam:'pte',published:false,price:10,accessMonths:1,includesGrammar:true,includesResources:true});
    await fixture('recorded_classes',testId,{packageId:testId,title:'Fixture lesson',published:true,order:0,bunnyLibraryId:'12345',bunnyVideoId:'12345678-abcd-abcd-abcd-123456789abc'});
    await fixture('recorded_learning_items',testId,{title:'Fixture grammar',kind:'video',group:'grammar',exam:'both',published:true,packageId:testId,order:1,bunnyLibraryId:'12345',bunnyVideoId:'12345678-abcd-abcd-abcd-123456789abc'});
    const path=`recorded-learning/documents/${testId}.pdf`;files.push(path);const pdf=Buffer.from('%PDF-1.4\n% Synthetic disposable integration fixture\n%%EOF');await bucket.file(path).save(pdf,{resumable:false,metadata:{contentType:'application/pdf'}});
    await fixture('recorded_learning_items',testId+'-doc',{title:'Fixture workbook.pdf',kind:'document',group:'resources',exam:'both',published:true,packageId:testId,order:2,storagePath:path});
    await fixture('recorded_enrollments',users[0]+'_'+testId,{userId:users[0],packageId:testId,status:'active',expiresAt:new Date(Date.now()+86400000)});
    assert.equal((await api('/admin')).status,401);assert.equal((await api('/admin',tokens[0])).status,403);assert.equal((await api('/admin',tokens[2])).status,200);
    const grammarEdit={id:testId,title:'Fixture grammar',kind:'video',exam:'both',published:true,packageId:testId,order:1,bunnyLibraryId:'12345',bunnyVideoId:'12345678-abcd-abcd-abcd-123456789abc'};
    assert.equal((await api('/admin',tokens[0],'POST',grammarEdit)).status,403);
    assert.equal((await api('/admin',tokens[2],'POST',{...grammarEdit,bunnyLibraryId:'invalid'})).status,400);
    assert.equal((await api('/admin',tokens[2],'POST',grammarEdit)).status,200);
    assert.equal((await api('/admin',tokens[2],'POST',{id:testId+'-doc',title:'Fixture workbook.pdf',kind:'document',exam:'both',published:true,packageId:testId,order:2,storagePath:`gs://${config.storageBucket}/${path}`})).status,200);
    assert.equal((await api('?packageId='+testId,tokens[1])).status,404);
    let detail=await(await api('?packageId='+testId,tokens[0])).json();assert.equal(detail.allowed,true);assert.equal(detail.items.length,3);assert.ok(!JSON.stringify(detail.items).includes('bunnyVideoId'));assert.ok(!JSON.stringify(detail.items).includes('storagePath'));
    const query='/media?packageId='+testId+'&itemId='+encodeURIComponent('class:'+testId);
    assert.equal((await api(query,tokens[1])).status,403);const video=await(await api(query,tokens[0])).json();assert.ok(video.url.startsWith('https://iframe.mediadelivery.net/embed/'));
    const progress={packageId:testId,itemId:'class:'+testId,completed:true};assert.equal((await api('/progress',tokens[1],'PATCH',progress)).status,403);assert.equal((await api('/progress',tokens[0],'PATCH',progress)).status,200);
    detail=await(await api('?packageId='+testId,tokens[0])).json();assert.ok(detail.progress.completed.includes('class:'+testId));
    const resource=await(await api('/media?packageId='+testId+'&itemId='+encodeURIComponent('shared:'+testId+'-doc'),tokens[0])).json();assert.ok(resource.url&&!resource.error);const downloaded=await fetch(resource.url);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),pdf);
    await db.collection('recorded_enrollments').doc(users[0]+'_'+testId).update({expiresAt:new Date(Date.now()-1000)});assert.equal((await api(query,tokens[0])).status,403);assert.equal((await api('/progress',tokens[0],'PATCH',progress)).status,403);
    console.log('Passed live: private outlines, active/expired access, cross-user denial, admin guard, Bunny URL generation, saved lesson completion and signed Firebase document downloads. No real payments, videos, email or business content modified.');
  }finally{
    for(const path of files){if(!path.includes(testId))throw new Error('Unsafe cleanup path');await bucket.file(path).delete({ignoreNotFound:true})}
    for(const ref of refs)await ref.delete();
    for(const uid of users){if(!uid.startsWith('codex-recorded-smoke-'))throw new Error('Unsafe test account');await db.collection('users').doc(uid).collection('recorded_progress').doc(testId).delete();await db.collection('users').doc(uid).delete();await auth.deleteUser(uid)}
    await app.delete();
  }
}
main().catch(error=>{console.error(error.message||'Recorded-learning integration failed');process.exitCode=1});
