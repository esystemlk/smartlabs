// Deterministic security/domain tests. No Firebase, Bunny, PayHere or email calls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto');
const records=new Map(),cache=new Map();
function ref(key){return {get:async()=>({exists:records.has(key),id:key.split('/').pop(),data:()=>records.get(key)}),collection:name=>col(key+'/'+name)}}
function col(key){
  const filters=[];
  const q={
    doc:id=>ref(key+'/'+id),
    where:(field,op,value)=>{filters.push([field,value]);return q},
    get:async()=>({docs:[...records].filter(([path,data])=>path.startsWith(key+'/')&&!path.slice(key.length+1).includes('/')&&filters.every(([field,value])=>data[field]===value)).map(([path,data])=>({id:path.split('/').pop(),data:()=>data}))}),
  };
  return q;
}
const env={};
function load(file){file=require('node:path').resolve(file);if(cache.has(file))return cache.get(file);const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports,Date,URL,process:{env},require:name=>name==='server-only'?{}:name==='@/lib/firebase-admin'?{adminDb:{collection:col}}:name.startsWith('@/')?load('src/'+name.slice(2)+'.ts'):require(name)});cache.set(file,exports);return exports}
async function main(){
 const domain=load('src/lib/recorded-learning.ts'),server=load('src/lib/server/recorded-learning.ts'),types=load('src/types/recorded-package.ts');
 const pkg={id:'pte',title:'PTE course',exam:'pte',includesGrammar:true,includesResources:true,published:true};
 const grammar={id:'grammar1',title:'Grammar',kind:'video',group:'grammar',exam:'both',published:true,order:1,bunnyLibraryId:'123',bunnyVideoId:'12345678-abcd'};
 assert.equal(domain.itemBelongs(grammar,pkg),true);assert.equal(domain.itemBelongs(grammar,{...pkg,exam:'ielts'}),true);assert.equal(domain.itemBelongs(grammar,{...pkg,includesGrammar:false}),false);
 assert.equal(domain.itemBelongs({...grammar,exam:'ielts'},pkg),false);assert.equal(domain.itemBelongs({...grammar,packageId:'other'},pkg),false);assert.equal(domain.itemBelongs({...grammar,published:false},pkg),false);
 assert.equal(domain.packageExam({title:'IELTS recordings'}),'ielts');assert.equal(domain.packageExam({title:'Old recorded package'}),'pte');
 assert.equal(types.addMonths(new Date(2026,0,31),1).getDate(),28,'Jan 31 access must not overflow into March');assert.equal(types.addMonths(new Date(2028,0,31),1).getDate(),29);
 records.set('recorded_packages/pte',pkg);records.set('recorded_classes/core',{packageId:'pte',title:'Core lesson',order:0,published:true,bunnyLibraryId:'123',bunnyVideoId:'12345678-abcd'});records.set('recorded_classes/draft',{packageId:'pte',title:'Draft',published:false});records.set('recorded_learning_items/grammar1',grammar);records.set('recorded_learning_items/ielts-only',{...grammar,exam:'ielts'});
 assert.equal((await server.learningPackage('pte')).allowed,false);assert.equal((await server.learningPackage('pte','alice')).allowed,false);
 records.set('recorded_enrollments/alice_pte',{status:'active',expiresAt:new Date(Date.now()+100000)});assert.equal((await server.learningPackage('pte','alice')).allowed,true);assert.equal((await server.learningPackage('pte','bob')).allowed,false);
 records.set('recorded_enrollments/alice_pte',{status:'suspended',expiresAt:new Date(Date.now()+100000)});assert.equal((await server.learningPackage('pte','alice')).allowed,false);
 records.set('recorded_enrollments/alice_pte',{status:'active',expiresAt:new Date(Date.now()-1)});assert.equal((await server.learningPackage('pte','alice')).allowed,false);
 records.set('recorded_enrollments/alice_pte',{status:'active'});assert.equal((await server.learningPackage('pte','alice')).allowed,false,'missing expiry must fail closed');
 assert.equal((await server.learningPackage('pte','staff','admin')).allowed,true);
 records.set('recorded_packages/draft',{...pkg,id:'draft',published:false});assert.equal(await server.learningPackage('draft','bob'),null);
 const items=await server.learningItems(pkg);assert.equal(items.length,2);assert.equal(items[0].id,'class:core');const safe=server.safeLearningItem(items[1]);for(const key of ['bunnyLibraryId','bunnyVideoId','storagePath'])assert.ok(!(key in safe));
 env.BUNNY_STREAM_EMBED_KEYS=JSON.stringify({'123':'test-key-only'});const url=new URL(server.learningEmbedUrl('123','12345678-abcd',Date.now()+60000));const expires=url.searchParams.get('expires');assert.equal(url.searchParams.get('token'),crypto.createHash('sha256').update('test-key-only12345678-abcd'+expires).digest('hex'));assert.ok(Number(expires)*1000<=Date.now()+60000);assert.ok(!url.toString().includes('test-key-only'));
 assert.throws(()=>server.learningEmbedUrl('../bad','12345678-abcd',0));
 console.log('Passed: shared PTE/IELTS grammar, scope filtering, draft exclusion, owner/expiry/suspension checks, safe outlines, end-of-month access and signed Bunny URLs.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
