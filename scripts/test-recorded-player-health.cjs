// Regression: Bunny can return an error page with HTTP 200. No live services used.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('scripts/check-recorded-learning.cjs','utf8');
async function check(html,status=200){
  const output=[],processMock={env:{FIREBASE_ADMIN_CONFIG:'{}'},exitCode:0,cwd:()=>process.cwd()};
  const app={firestore:()=>({collection:name=>({get:async()=>({size:name==='recorded_classes'?1:0,docs:name==='recorded_classes'?[{data:()=>({bunnyLibraryId:'123',bunnyVideoId:'test-video',published:true})}]:[]})})}),delete:async()=>{}};
  const sdk={initializeApp:()=>app,credential:{cert:()=>({})}};
  await vm.runInNewContext(source,{require:name=>name==='firebase-admin'?sdk:name==='@next/env'?{loadEnvConfig:()=>{}}:require(name),process:processMock,AbortSignal,fetch:async()=>({status,ok:status>=200&&status<300,text:async()=>html}),console:{log:value=>output.push(JSON.parse(value)),error:()=>{}}});
  return {code:processMock.exitCode,result:output[0]};
}
async function main(){
 const missing=await check('<html><head><title>\n 404 \n</title></head><body><h1>404</h1></body></html>');assert.equal(missing.code,1);assert.equal(missing.result.embedErrorPage,true);assert.equal(missing.result.embedPlayerDetected,false);
 const forbidden=await check('<title>403 Forbidden</title><h1>403</h1>',403);assert.equal(forbidden.code,1);
 const valid=await check('<html><video data-plyr-config=\'{"title":"Example lesson"}\'></video></html>');assert.equal(valid.code,0);assert.equal(valid.result.embedPlayerDetected,true);assert.equal(valid.result.embedErrorPage,false);
 console.log('Passed: Bunny HTTP-200 error pages fail health checks; real player markup passes.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
