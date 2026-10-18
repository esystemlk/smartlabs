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
const config = configModule.defaultTheme;
// Read the distributed CJS directly: the installed package marks .js as ESM.
const icons = {};
vm.runInNewContext(`(function(exports,require){${fs.readFileSync(require.resolve('lucide-react'), 'utf8')}\n})`, {})(icons, require);
const anchor = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
const cssFolder = path.join(root, '.next/static/css');
const fixtureCss = path.join(root, 'tmp/seasonal-visual.css');
const utilityCss = fs.existsSync(fixtureCss) ? fs.readFileSync(fixtureCss, 'utf8') : fs.existsSync(cssFolder) ? fs.readdirSync(cssFolder).filter(p => p.endsWith('.css')).map(p => fs.readFileSync(path.join(cssFolder, p), 'utf8')).join('\n') : '';
const css = utilityCss + '\n' + fs.readFileSync(path.join(root, 'src/app/seasonal.css'), 'utf8');
function hero() {
  const component = load('src/components/seasonal/seasonal-hero.tsx', {
    react: React, 'next/link': anchor,
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config, active: true, paused: true, preview: true }) },
  });
  return renderToStaticMarkup(React.createElement(component.SeasonalHero));
}
function admin(tab) {
  let stateIndex = 0;
  const mockReact = { ...React, useEffect: () => {}, useCallback: fn => fn, useState: initial => {
    const index = stateIndex++;
    const override = { 1: JSON.stringify(config), 5: tab, 6: false, 7: true };
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
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:9014');
  const asset = configModule.bundledSeasonalAssetPaths.includes(url.pathname);
  if (asset) { res.setHeader('Content-Type', 'image/webp'); res.end(fs.readFileSync(path.join(root, 'public', url.pathname))); return; }
  if (url.pathname === '/styles.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
  const tab = url.searchParams.get('tab') || 'Overview';
  const isAdmin = url.pathname === '/admin';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Halloween isolated visual test</title><link rel="stylesheet" href="/styles.css"><style>body{font-family:Arial,sans-serif}.fixture-note{padding:12px 24px;background:#fff7ed;color:#7c2d12;font:12px Arial}.fixture-note a{margin-right:18px;text-decoration:underline}</style></head><body style="--seasonal-accent:#FF9A3D"><div class="fixture-note">Read-only visual fixture · synthetic data · no publishing or Firebase connection<br><a href="/">Hero</a><a href="/admin">Admin overview</a><a href="/admin?tab=Schedule">Schedule</a><a href="/admin?tab=Hero%20%26%20footer">Artwork controls</a><a href="/admin?tab=Assets">Assets</a></div>${isAdmin ? admin(tab) : hero()}</body></html>`);
}).listen(9014, '127.0.0.1', () => console.log('Read-only visual fixture: http://localhost:9014'));
