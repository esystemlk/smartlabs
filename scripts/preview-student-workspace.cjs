// Read-only loopback fixture of the real presentation components. No Firebase or payments.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,require:name=>name in imports?imports[name]:require(name),React});return exports}
const catalog=load('src/lib/pte-catalog.ts');
const nav=load('src/lib/student-navigation.ts',{'./pte-catalog':catalog});
const icons={};vm.runInNewContext(`(function(exports,require){${fs.readFileSync(require.resolve('lucide-react'),'utf8')}\n})`,{})(icons,require);
const anchor=({href,children,...props})=>React.createElement('a',{href,...props},children);
const views=load('src/components/dashboard/student-views.tsx',{'next/link':anchor,'lucide-react':icons,'@/lib/pte-catalog':catalog,'@/lib/student-navigation':nav});
const ieltsCatalog=load('src/lib/ielts-catalog.ts');
const ielts=load('src/components/ielts/studio.tsx',{'next/link':anchor,'next/image':()=>null,'lucide-react':icons,'@/lib/ielts-catalog':ieltsCatalog,'@/components/dashboard/student-views':views});
const popover=load('src/components/ui/popover.tsx',{'@/lib/utils':{cn:(...parts)=>parts.filter(Boolean).join(' ')}});
const dock=load('src/components/dashboard/student-dock.tsx',{'next/link':anchor,'lucide-react':icons,'@/lib/student-navigation':nav,'@/components/ui/popover':popover});
const emptyData=load('src/components/dashboard/student-data.tsx',{'react':{...React,useState:initial=>React.useState(initial==='loading'?'ready':initial)},'next/link':anchor,'@/firebase':{useUser:()=>({user:null}),useFirestore:()=>null}});
const registrations=load('src/app/dashboard/registrations/page.tsx',{'@/components/dashboard/student-data':emptyData,'@/components/dashboard/student-views':views});
const results=load('src/app/dashboard/results/page.tsx',{'@/components/dashboard/student-data':emptyData,'@/components/dashboard/student-views':views});
const creditModel=load('src/lib/student-credits.ts',{'./mock-packages':load('src/lib/mock-packages.ts'),'./ielts-mock-packages':load('src/lib/ielts-mock-packages.ts')});
const creditUi=load('src/components/dashboard/student-credits.tsx',{'next/link':anchor,'lucide-react':icons,'@/firebase':{useUser:()=>({user:null}),useFirestore:()=>null},'@/lib/student-credits':creditModel});
const guideData=load('src/lib/student-guide.ts');
const guide=load('src/components/guide/website-guide.tsx',{'next/link':anchor,'lucide-react':icons,'@/lib/student-guide':guideData,'./website-guide.css':{}});
const accessibility=load('src/components/accessibility/accessibility-widget.tsx',{'lucide-react':icons,'@/components/ui/button':{Button:props=>React.createElement('button',props)},'@/lib/utils':{cn:(...parts)=>parts.filter(Boolean).join(' ')},'@/hooks/use-toast':{useToast:()=>({toast:()=>{}})}});
const utilityFolder='.next/static/css';
const utilityCss=fs.existsSync(utilityFolder)?fs.readdirSync(utilityFolder).filter(file=>file.endsWith('.css')).map(file=>fs.readFileSync(path.join(utilityFolder,file),'utf8')).join('\n'):'';
const css=utilityCss+'\n'+['src/components/dashboard/student-workspace.css','src/app/dashboard/ielts/studio.css','src/components/guide/website-guide.css'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/images/student/')||url.pathname.startsWith('/images/guide/')||url.pathname==='/logo.png'){
  const file=path.resolve('public','.'+url.pathname),root=path.resolve('public')+path.sep;
  if(file.startsWith(root)&&fs.existsSync(file)){res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'image/webp');return fs.createReadStream(file).pipe(res)}res.writeHead(404);return res.end();
 }
 const component=url.pathname.endsWith('/registrations')?React.createElement(registrations.default):url.pathname.endsWith('/results')?React.createElement(results.default):url.pathname.endsWith('/guide')?React.createElement(guide.WebsiteGuide):url.pathname.includes('ielts')?React.createElement(ielts.IeltsStudio,{section:url.searchParams.get('skill')||undefined}):url.pathname.includes('pte')?React.createElement(views.PteDashboardView,{skill:url.searchParams.get('skill')||undefined}):React.createElement(views.StudentHomeView,{name:'Student',credits:React.createElement('section',{className:'student-panel'},React.createElement('h2',null,'Your credits — preview example'),React.createElement(creditUi.StudentCreditDetails,{data:url.searchParams.get('credits')==='paid'?{universalPaidCredits:40,mockPaidCredits:3,ieltsMockPaidCredits:2,essayPaidCredits:5}:{},now:Date.now()}))});
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}a{color:inherit;text-decoration:none}h1,h2,p{margin:0}'+css+'</style></head><body class="student-workspace"><header class="student-workspace-header"><a class="student-workspace-brand" href="/dashboard"><img src="/logo.png" width="34" height="34" alt="SmartLabs"/><span>SmartLabs<small>Student Space</small></span></a></header><main class="student-dock-content" style="padding:32px 32px 140px"><div class="student-search"><input type="search" aria-label="Find PTE or IELTS practice" placeholder="Find practice: PTE writing, IELTS reading…"/></div>'+renderToStaticMarkup(component)+'</main>'+renderToStaticMarkup(React.createElement(dock.StudentDock,{pathname:url.pathname==='/'?'/dashboard':url.pathname,onSignOut:()=>{}}))+renderToStaticMarkup(React.createElement(accessibility.AccessibilityWidget))+'</body></html>');
}).listen(9015,'127.0.0.1',()=>console.log('Read-only student preview: http://127.0.0.1:9015'));
