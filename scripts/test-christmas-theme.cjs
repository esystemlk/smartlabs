const assert=require('node:assert/strict');const {test}=require('node:test');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React}}).outputText;vm.runInNewContext(code,{exports,React,require:name=>imports[name]??require(name),Date,structuredClone});return exports;}
const cfg=load('src/lib/seasonal-theme/config.ts');const {christmasTheme,defaultTheme,themeSchema,resolveTheme,occurrences,publishedThemes,selectTheme,eligibleRoute}=cfg;
const at=s=>Date.parse(s);const automatic=base=>({...structuredClone(base),mode:'automatic'});
test('Christmas repeats through next January with exact Sri Lanka boundaries and start-year exclusions',()=>{
 const c=automatic(christmasTheme);
 for(const year of [2026,2027,2028]){assert.equal(resolveTheme(c,at(`${year}-11-30T23:59:59+05:30`)).active,false);assert.equal(resolveTheme(c,at(`${year}-12-01T00:00:00+05:30`)).active,true);assert.equal(resolveTheme(c,at(`${year}-12-31T23:59:59+05:30`)).active,true);assert.equal(resolveTheme(c,at(`${year+1}-01-01T00:00:00+05:30`)).active,false);}
 c.schedule.endDay=3;c.schedule.excludedYears=[2026];assert.equal(resolveTheme(c,at('2027-01-02T00:00:00+05:30')).active,false);assert.equal(resolveTheme(c,at('2027-12-25T00:00:00+05:30')).active,true);
});
test('legacy id-less runtime settings become Halloween without changing schedule, mode or media',()=>{
 const legacy=automatic(defaultTheme);delete legacy.id;delete legacy.priority;delete legacy.effects.snow;delete legacy.effects.snowScope;delete legacy.effects.sleigh;
 const entries=publishedThemes({config:legacy,version:'legacy',publishedAt:123});assert.equal(entries.halloween.config.id,'halloween');assert.equal(entries.halloween.config.mode,'automatic');assert.equal(entries.halloween.config.media.hero,legacy.media.hero);assert.equal(JSON.stringify(entries.halloween.config.schedule),JSON.stringify(legacy.schedule));assert.equal(entries.christmas,undefined);
 assert.equal(Object.keys(publishedThemes({config:{...legacy,id:'unknown'}})).length,0);
});
test('two seasons select independently; manual, priority and stable ID resolve overlaps deterministically',()=>{
 const h=automatic(defaultTheme),c=automatic(christmasTheme);assert.equal(selectTheme([h,c],at('2026-10-31')).id,'halloween');assert.equal(selectTheme([h,c],at('2026-12-25')).id,'christmas');assert.equal(selectTheme([h,c],at('2027-02-01')).mode,'off');
 h.schedule=structuredClone(c.schedule);assert.equal(selectTheme([c,h],at('2026-12-25')).id,'christmas');h.priority=50;assert.equal(selectTheme([c,h],at('2026-12-25')).id,'halloween');c.mode='manual';c.manualUntil='2026-12-26';assert.equal(selectTheme([h,c],at('2026-12-25')).id,'christmas');assert.equal(selectTheme([h,c],at('2026-12-26')).id,'halloween');
 h.priority=c.priority;c.mode='automatic';assert.equal(selectTheme([h,c],at('2026-12-25')).id,selectTheme([c,h],at('2026-12-25')).id);
});
test('Christmas schema defaults stay Off with silent audio, bounded effects and the same seven identities',()=>{
 const c=themeSchema.parse(christmasTheme);assert.equal(c.mode,'off');assert.equal(c.areas.sound,false);assert.equal(c.effects.mobile,false);assert.equal(c.effects.snow,true);assert.equal(c.effects.bats,false);assert.equal(c.effects.sleigh,false);assert.equal(cfg.christmasCharacters.map(c=>c.id).join(),cfg.halloweenCharacters.map(c=>c.id).join());assert.equal(themeSchema.safeParse({...c,priority:101}).success,false);
 for(const pathname of ['/admin/dashboard','/payment','/dashboard','/ai-essay-practice','/login','/mock-tests'])assert.equal(eligibleRoute(pathname,c),false);assert.equal(eligibleRoute('/courses',c),true);
 assert.match(occurrences(c,at('2026-12-25')).find(o=>o.start<=at('2026-12-25')&&o.end>at('2026-12-25')).id,/christmas-2026/);
});
function snow({scope='hero',hero=false,path='/',active=true,paused=false,medium=false,mobile=false,sleigh=false,disabled=false,id='christmas',snow=true}={}){
 const config=structuredClone(christmasTheme);config.id=id;config.effects={...config.effects,snowScope:scope,mobile,sleigh,snow};if(medium)config.motion='medium';if(disabled)config.areas.animations=false;
 const {SeasonalSnow}=load('src/components/seasonal/seasonal-snow.tsx',{'next/navigation':{usePathname:()=>path},'./seasonal-theme-provider':{useSeasonalTheme:()=>({config,active,paused})}});return renderToStaticMarkup(React.createElement(SeasonalSnow,{hero}));
}
test('hero snowfall and page-wide snowfall are mutually exclusive and respect homepage scope',()=>{
 assert.match(snow({hero:true}),/seasonal-snow-hero/);assert.equal(snow(),'');assert.equal(snow({hero:true,scope:'home'}),'');assert.match(snow({scope:'home'}),/seasonal-snow-screen/);assert.equal(snow({scope:'home',path:'/courses'}),'');assert.match(snow({scope:'site',path:'/courses'}),/seasonal-snow-screen/);
});
test('snow density is bounded and paused/mobile markup is decorative',()=>{
 const low=snow({hero:true,paused:true});assert.equal((low.match(/class="seasonal-snowflake"/g)||[]).length,12);assert.equal((snow({hero:true,medium:true}).match(/class="seasonal-snowflake"/g)||[]).length,24);assert.match(low,/aria-hidden="true"/);assert.match(low,/seasonal-static/);assert.match(low,/seasonal-effect-desktop/);assert.doesNotMatch(snow({hero:true,mobile:true}),/seasonal-effect-desktop/);
});
test('Off, Halloween and animation master suppress Christmas effects; sleigh is independent and hero-only',()=>{
 for(const opts of [{active:false},{id:'halloween'},{disabled:true},{snow:false}])assert.equal(snow({hero:true,...opts}),'');assert.match(snow({hero:true,snow:false,sleigh:true}),/seasonal-sleigh/);assert.equal(snow({snow:false,sleigh:true,scope:'site'}),'');
});
