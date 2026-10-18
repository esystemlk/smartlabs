// Isolated read-only visual fixture. No authentication bypass is added to Next.js.
// Run after a build has emitted CSS: node scripts/preview-seasonal-theme.cjs
// This loopback-only server has no database or publishing connection.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.join(__dirname, '..');
function load(file, imports) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, require: name => name in imports ? imports[name] : require(name), Date, structuredClone, URL, console, React });
  return exports;
}
const configModule = load('src/lib/seasonal-theme/config.ts', {});
const config = configModule.presetFor(process.env.SEASONAL_FIXTURE_THEME === 'christmas' ? 'christmas' : 'halloween');
// Read the distributed CJS directly: the installed package marks .js as ESM.
const icons = {};
vm.runInNewContext(`(function(exports,require){${fs.readFileSync(require.resolve('lucide-react'), 'utf8')}\n})`, {})(icons, require);
const anchor = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
const cssFolder = path.join(root, '.next/static/css');
const fixtureCss = path.join(root, 'tmp/seasonal-visual.css');
const utilityCss = fs.existsSync(fixtureCss) ? fs.readFileSync(fixtureCss, 'utf8') : fs.existsSync(cssFolder) ? fs.readdirSync(cssFolder).filter(p => p.endsWith('.css')).map(p => fs.readFileSync(path.join(cssFolder, p), 'utf8')).join('\n') : '';
const css = utilityCss + '\n' + fs.readFileSync(path.join(root, 'src/app/seasonal.css'), 'utf8');
function flight(hero, previewConfig = config, pathname = '/') {
  const component = load('src/components/seasonal/seasonal-flight.tsx', {
    react: React, 'next/navigation': { usePathname: () => pathname },
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config: previewConfig, active: true, paused: false }) },
  });
  return React.createElement(component.SeasonalFlight, { hero });
}
function hero(previewConfig = config) {
  const component = load('src/components/seasonal/seasonal-hero.tsx', {
    react: React, 'next/link': anchor,
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config: previewConfig, active: true, paused: false, preview: true }) },
    './seasonal-flight': { SeasonalFlight: () => flight(true, previewConfig) },
    './seasonal-snow': { SeasonalSnow: () => snow(true, previewConfig) },
    '@/lib/seasonal-theme/config': configModule,
  });
  return renderToStaticMarkup(React.createElement(component.SeasonalHero));
}
function snow(hero, previewConfig = config, pathname = '/') {
  const component = load('src/components/seasonal/seasonal-snow.tsx', {
    react: React, 'next/navigation': { usePathname: () => pathname },
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config: previewConfig, active: true, paused: false }) },
  });
  return React.createElement(component.SeasonalSnow, { hero });
}
function companions(placement, pathname = '/') {
  const component = load('src/components/seasonal/seasonal-companions.tsx', {
    react: React, 'next/navigation': { usePathname: () => pathname },
    '@/lib/seasonal-theme/config': configModule,
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config, active: true, paused: true, preview: true }) },
  });
  return renderToStaticMarkup(React.createElement(component.SeasonalCompanions, { placement }));
}
const contrastSource = ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/seasonal-theme/contrast.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function realSiteBootstrap(pathname) {
  const artwork = { intro: companions(pathname === '/' ? 'homeIntro' : 'pageIntro', pathname), courses: companions('homeCourses'), support: companions('homeSupport'), end: pathname === '/' ? '' : companions('pageEnd', pathname), footer: companions('footer', pathname), hero: hero() };
  return `<script>(function(){const exports={};${contrastSource}\n
    const config=${JSON.stringify(config)}, art=${JSON.stringify(artwork)};
    const body=document.body, main=document.querySelector('body > main');
    if(!main)return;
    const note=document.createElement('div');note.className='fixture-note';note.innerHTML='Read-only real-site layout preview · no database writes · <button id="fixture-theme-toggle">Use standard appearance</button> · <a href="/site/">Home</a><a href="/site/courses">Courses</a><a href="/site/contact">Contact</a><a href="/site/pte-registration">PTE registration</a>';body.prepend(note);
    const injected=[];
    const logos=[...document.querySelectorAll('body > header img[alt="Smart Labs Logo"],body > footer img[alt="Smart Labs Logo"]')].map(img=>({img,src:img.getAttribute('src'),srcset:img.getAttribute('srcset'),style:img.getAttribute('style')}));
    const insert=(anchor,position,html)=>{if(!anchor||!html)return;const container=document.createElement('div');container.className='fixture-characters';container.innerHTML=html;anchor.insertAdjacentElement(position,container);injected.push(container);};
    if(${JSON.stringify(pathname)}==='/'){
      const oldHero=main.querySelector('section');oldHero?.classList.add('standard-home-hero');
      insert(oldHero,'beforebegin',art.hero+art.intro);
      insert(main.querySelector('#courses'),'beforebegin',art.courses);
      const heading=[...main.querySelectorAll('h2')].find(el=>el.textContent.includes('Four'));
      insert(heading?.closest('section'),'beforebegin',art.support);
    }else{insert(main,'afterbegin',art.intro);insert(main,'beforeend',art.end);}
    insert(document.querySelector('body > footer'),'beforebegin',art.footer);
    const hsl=hex=>{const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d)h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;return ((h*60+360)%360)+' '+(d?d/(1-Math.abs(2*l-1))*100:0)+'% '+l*100+'%';};
    let stop=()=>{};
    function enable(){body.dataset.seasonal=config.id;['palette','header','hero','footer'].forEach(key=>body.setAttribute('data-seasonal-'+key,'true'));body.dataset.seasonalPaused='true';
      Object.entries({background:config.colours.background,surface:config.colours.surface,text:config.colours.text,accent:config.colours.accent,secondary:config.colours.secondary}).forEach(([key,value])=>body.style.setProperty('--seasonal-'+key,value));
      body.style.setProperty('--seasonal-footer-image','url("'+config.media.footer+'")');
      const pairs={background:config.colours.background,card:config.colours.surface,popover:config.colours.surface,foreground:config.colours.text,'card-foreground':config.colours.text,'popover-foreground':config.colours.text,primary:config.colours.accent,'primary-foreground':'#160F24',secondary:config.colours.surface,'secondary-foreground':config.colours.text,muted:config.colours.surface,'muted-foreground':'#D0C4DB',accent:config.colours.secondary,'accent-foreground':'#160F24',border:'#5C456D',input:'#5C456D',ring:config.colours.accent,'accent-1':config.colours.accent,'accent-2':'#80D9B1','accent-3':config.colours.secondary,'accent-4':config.colours.accent};
      Object.entries(pairs).forEach(([key,value])=>body.style.setProperty('--seasonal-token-'+key,hsl(value)));
      injected.forEach(el=>el.hidden=false);logos.forEach(({img})=>{img.src=config.branding.logo;img.removeAttribute('srcset');img.style.width='180px';img.style.height='64px';img.style.objectFit='contain';});const started=performance.now();stop=exports.installSeasonalContrast(body,el=>!el.closest('.fixture-note'));body.dataset.fixtureContrastMs=String(Math.round(performance.now()-started));}
    enable();document.getElementById('fixture-theme-toggle').onclick=()=>{if(body.dataset.seasonal){stop();[...body.attributes].filter(a=>a.name.startsWith('data-seasonal')).forEach(a=>body.removeAttribute(a.name));[...body.style].filter(name=>name.startsWith('--seasonal-')).forEach(name=>body.style.removeProperty(name));injected.forEach(el=>el.hidden=true);logos.forEach(({img,src,srcset,style})=>{for(const[name,value]of[['src',src],['srcset',srcset],['style',style]]){if(value===null)img.removeAttribute(name);else img.setAttribute(name,value);}});}else enable();};
  })();</script>`;
}
function admin(tab) {
  let stateIndex = 0;
  const mockReact = { ...React, useEffect: () => {}, useCallback: fn => fn, useState: initial => {
    const index = stateIndex++;
    const override = { 0: config, 1: config.id, 3: JSON.stringify(config), 7: tab, 8: false, 9: true };
    return [index in override ? override[index] : typeof initial === 'function' ? initial() : initial, () => {}];
  } };
  const Button = ({ children, variant, size, asChild, ...props }) => React.createElement('button', { ...props, disabled: true, className: `inline-flex items-center rounded-lg border px-4 py-2 text-sm ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-card'} ${props.className || ''}` }, children);
  const module = load('src/app/admin/dashboard/seasonal-themes/page.tsx', {
    react: mockReact, 'next/link': anchor,
    '@/firebase': { useAuth: () => null, useUser: () => ({ user: null, isUserLoading: false }) },
    '@/lib/seasonal-theme/config': configModule, '@/components/ui/button': { Button },
    'lucide-react': icons,
  });
  return renderToStaticMarkup(React.createElement(module.default));
}
http.createServer(async (req, res) => {
  if (req.method !== 'GET') { res.writeHead(405); res.end('Read-only fixture'); return; }
  const url = new URL(req.url, 'http://localhost:9014');
  const asset = configModule.bundledSeasonalAssetPaths.includes(url.pathname);
  if (asset) { res.setHeader('Content-Type', 'image/webp'); res.end(fs.readFileSync(path.join(root, 'public', url.pathname))); return; }
  if (url.pathname === '/styles.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
  if (url.pathname.startsWith('/site')) {
    const pathname = url.pathname.slice(5) || '/';
    if (!['/', '/courses', '/contact', '/resources', '/blog', '/pte-registration', '/ielts-registration', '/workshops', '/webinar', '/policies', '/support', '/corporate-training', '/pte-exam-guide'].includes(pathname)) { res.writeHead(404); res.end('Choose a public preview route'); return; }
    try {
      const upstream = await fetch('http://localhost:9002' + pathname);
      let html = (await upstream.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      html = html.replace('</head>', '<link rel="stylesheet" href="/styles.css"><style>body{padding-top:80px!important;font-family:Arial,sans-serif!important}.fixture-note{position:relative;z-index:60;padding:12px;background:#fff7ed;color:#160f24;font:12px Arial}.fixture-note a{margin-left:12px;text-decoration:underline}[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}</style></head>');
      html = html.replace('</body>', realSiteBootstrap(pathname) + '</body>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(html);return;
    } catch { res.writeHead(503);res.end('Start the ordinary local website on port 9002 first.');return; }
  }
  if (url.pathname.startsWith('/_next/') || /\.(png|jpe?g|svg|ico|woff2?)$/.test(url.pathname)) {
    try { const upstream=await fetch('http://localhost:9002'+url.pathname+url.search);res.statusCode=upstream.status;res.setHeader('Content-Type',upstream.headers.get('content-type')||'application/octet-stream');res.end(Buffer.from(await upstream.arrayBuffer()));return; } catch { res.writeHead(404);res.end();return; }
  }
  const tab = url.searchParams.get('tab') || 'Overview';
  const isAdmin = url.pathname === '/admin';
  const previewConfig = structuredClone(config);
  if (['hero', 'home', 'site'].includes(url.searchParams.get('flight'))) previewConfig.effects.batScope = url.searchParams.get('flight');
  if (['hero', 'home', 'site'].includes(url.searchParams.get('snow'))) previewConfig.effects.snowScope = url.searchParams.get('snow');
  previewConfig.effects.sleigh = url.searchParams.get('sleigh') === '1';
  previewConfig.effects.mobile = url.searchParams.get('mobile') === '1';
  const motionPreview = hero(previewConfig) + renderToStaticMarkup(flight(false, previewConfig)) + renderToStaticMarkup(snow(false, previewConfig));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${configModule.themeLabel(config.id)} isolated visual test</title><link rel="stylesheet" href="/styles.css"><style>body{font-family:Arial,sans-serif}.fixture-note{padding:12px 24px;background:#fff7ed;color:#7c2d12;font:12px Arial}.fixture-note a{margin-right:18px;text-decoration:underline}</style></head><body data-seasonal="${config.id}" style="--seasonal-accent:${config.colours.accent}"><div class="fixture-note">Read-only visual fixture · synthetic data · no publishing or Firebase connection<br><a href="/">Hero</a><a href="/admin">Admin overview</a><a href="/admin?tab=Schedule">Schedule</a><a href="/admin?tab=Hero%20%26%20footer">Artwork controls</a><a href="/admin?tab=Assets">Assets</a><button onclick="document.body.classList.toggle('seasonal-static')">Pause / resume preview</button></div>${isAdmin ? admin(tab) : motionPreview}</body></html>`);
}).listen(9014, '127.0.0.1', () => console.log('Read-only visual fixture: http://localhost:9014'));
