const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const load=(file,imports={})=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>imports[name]??require(name),structuredClone,Date,URL,process});return exports};
const cfg=load('src/lib/seasonal-theme/config.ts'),routes=load('src/lib/seasonal-theme/dashboard-routes.ts',{'./config':cfg});
const legacy=structuredClone(cfg.defaultTheme);delete legacy.dashboard;assert.equal(cfg.themeSchema.parse(legacy).dashboard.enabled,false);
const config=structuredClone(cfg.defaultTheme);config.dashboard.enabled=true;
for(const path of ['/dashboard','/dashboard/pte',...['speaking','writing','reading','listening'].map(skill=>'/dashboard/pte/'+skill),'/dashboard/ielts',...['speaking','writing','reading','listening','mock-tests'].map(skill=>'/dashboard/ielts/'+skill),...['registrations','results','settings','support','certificate-request','guide'].map(page=>'/dashboard/'+page)]){assert.equal(routes.eligibleDashboardRoute(path,config),true,path);assert.equal(cfg.eligibleRoute(path,config),false,'Public theme must stay excluded: '+path);}
for(const path of ['/dashboard/practice/read-aloud','/dashboard/pte/speaking/task','/dashboard/ielts/reading/cambridge-21-test-1','/dashboard/ielts/mock-tests/mock-1','/dashboard/ielts/mock-tests/results','/dashboard/recordings','/dashboard/new-unknown-tool','/ai-essay-practice','/credits','/payment-success','/admin/dashboard'])assert.equal(routes.eligibleDashboardRoute(path,config),false,path);
config.dashboard.pages.pte=false;assert.equal(routes.eligibleDashboardRoute('/dashboard/pte/speaking',config),false);config.dashboard.pages.pte=true;
config.routes.excluded=['/dashboard/pte'];assert.equal(routes.eligibleDashboardRoute('/dashboard/pte/writing',config),false);assert.equal(routes.eligibleDashboardRoute('/dashboard/ielts',config),true);
config.routes.excluded=['/'];assert.equal(routes.eligibleDashboardRoute('/dashboard',config),false);config.routes.excluded=[];
const christmas=structuredClone(cfg.christmasTheme);christmas.dashboard.enabled=true;assert.equal(cfg.themeSchema.safeParse(christmas).success,false);assert.equal(routes.eligibleDashboardRoute('/dashboard',christmas),false);
const server=load('src/lib/seasonal-theme/server.ts',{'server-only':{},'@/lib/firebase-admin':{},'@/lib/api-auth':{},'./config':cfg});
assert.equal(server.validatePublishedMedia(config),null);
for(const [key,value] of Object.entries(config.dashboard.media)){assert.ok(fs.existsSync('public'+value),key);}
const unsafe=structuredClone(config);unsafe.dashboard.media['home-banner']='https://untrusted.example/art.webp';assert.ok(server.validatePublishedMedia(unsafe));
const unreadable=structuredClone(config);unreadable.dashboard.colours.muted=unreadable.dashboard.colours.surface;assert.match(server.validatePublishedMedia(unreadable),/contrast/);
const missing=structuredClone(config);missing.dashboard.media['pte-banner']='';assert.ok(server.validatePublishedMedia(missing));
const navigation=load('src/lib/admin-navigation.ts');const tools=navigation.adminNavigation.flatMap(group=>group.items);assert.equal(tools.length,27);assert.equal(new Set(tools.map(tool=>tool.href)).size,27);for(const tool of tools)assert.ok(fs.existsSync('src/app'+tool.href+'/page.tsx'),tool.href);
console.log('Passed: legacy defaults, dashboard allowlist and training exclusions, page switches, Christmas isolation, contrast/media publication checks, eight images and all 27 admin destinations.');
