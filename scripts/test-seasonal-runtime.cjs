// Read-only public route tests with isolated records, no Firebase connection.
const assert=require('node:assert/strict');const {test}=require('node:test');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>imports[name]??require(name),Date,structuredClone,URL});return exports;}
const cfg=load('src/lib/seasonal-theme/config.ts');let runtime;const records=new Map();let role='admin';
const snap=data=>({exists:!!data,data:()=>data});
const api=load('src/app/api/seasonal-theme/route.ts',{
 '@/lib/firebase-admin':{adminAuth:{verifySessionCookie:async()=>({uid:'admin-1'})},adminDb:{collection:name=>({doc:id=>({get:async()=>snap(name==='users'?{role}:records.get(id))})})}},
 '@/lib/seasonal-theme/server':{themeRefs:()=>({runtime:{get:async()=>snap(runtime)}})},'@/lib/seasonal-theme/config':cfg,
});
const request=(query='',cookie=false)=>({nextUrl:new URL('http://localhost/api/seasonal-theme'+query),cookies:{get:()=>cookie?{value:'isolated-cookie'}:undefined}});
test('legacy published runtime is read without migration or activation changes',async()=>{
 const c=structuredClone(cfg.defaultTheme);delete c.id;c.mode='automatic';runtime={config:c,version:'legacy',publishedAt:1};const before=JSON.stringify(runtime);
 const response=await api.GET(request());const body=await response.json();assert.equal(response.status,200);assert.equal(body.configs.length,1);assert.equal(body.configs[0].id,'halloween');assert.equal(body.configs[0].mode,'automatic');assert.equal(JSON.stringify(runtime),before);assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('public manifest returns both published candidates without draft or editor information',async()=>{
 const h=structuredClone(cfg.defaultTheme),c=structuredClone(cfg.christmasTheme);h.mode=c.mode='manual';h.manualUntil=c.manualUntil='2099-01-01T00:00:00Z';runtime={schemaVersion:2,themes:{halloween:{config:h,version:'h',publishedAt:1,createdBy:'private-editor'},christmas:{config:c,version:'c',publishedAt:2,createdBy:'private-editor'}},privateDraft:'not-public',updatedAt:2};
 const body=await(await api.GET(request())).json();assert.equal(body.config.id,'christmas');assert.equal(body.configs.length,2);assert.doesNotMatch(JSON.stringify(body),/private-editor|privateDraft|createdBy/);assert.equal(body.preview,undefined);
});
test('private previews require a cookie, current admin role and unexpired theme-specific record',async()=>{
 assert.equal((await api.GET(request('?preview=1&theme=christmas'))).status,401);role='student';assert.equal((await api.GET(request('?preview=1&theme=christmas',true))).status,403);role='admin';records.set('admin-1-christmas',{config:cfg.christmasTheme,expiresAt:1});assert.equal((await api.GET(request('?preview=1&theme=christmas',true))).status,401);assert.equal((await api.GET(request('?preview=1&theme=unknown',true))).status,400);
});
test('Halloween and Christmas previews remain independent and reject a mismatched record',async()=>{
 records.set('admin-1-christmas',{config:cfg.christmasTheme,expiresAt:Date.now()+60_000});records.set('admin-1-halloween',{config:cfg.defaultTheme,expiresAt:Date.now()+60_000});
 for(const id of cfg.themeIds){const response=await api.GET(request('?preview=1&theme='+id,true));const body=await response.json();assert.equal(response.status,200);assert.equal(body.config.id,id);assert.equal(body.preview,true);assert.equal(body.configs,undefined);}
 records.set('admin-1-christmas',{config:cfg.defaultTheme,expiresAt:Date.now()+60_000});assert.equal((await api.GET(request('?preview=1&theme=christmas',true))).status,400);
});
