// Render the actual flight component with isolated theme/router state.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function compile(file, imports) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, React, require: name => imports[name] || require(name), Date, structuredClone });
  return exports;
}
const { defaultTheme } = compile('src/lib/seasonal-theme/config.ts', {});
function render(scope, pathname = '/', options = {}) {
  const config = structuredClone(defaultTheme);
  config.effects.batScope = scope;
  if (options.disabled) config.areas.animations = false;
  if (options.noBats) config.effects.bats = false;
  if (options.medium) config.motion = 'medium';
  const { SeasonalFlight } = compile('src/components/seasonal/seasonal-flight.tsx', {
    'next/navigation': { usePathname: () => pathname },
    './seasonal-theme-provider': { useSeasonalTheme: () => ({ config, active: options.active !== false, paused: !!options.paused }) },
  });
  return renderToStaticMarkup(React.createElement(SeasonalFlight, { hero: !!options.hero }));
}
test('hero scope renders only inside hero and avoids duplicate screen bats', () => {
  assert.match(render('hero', '/', { hero: true }), /seasonal-flight-hero/);
  assert.equal(render('hero'), '');
  assert.equal(render('home', '/', { hero: true }), '');
});
test('homepage screen scope does not spill onto other pages; site scope permits public pages', () => {
  assert.match(render('home'), /seasonal-flight-screen/);
  assert.equal(render('home', '/courses'), '');
  assert.match(render('site', '/courses'), /seasonal-flight-screen/);
});
test('off, disabled animations and disabled bats render no flight layer', () => {
  for (const options of [{ active: false }, { disabled: true }, { noBats: true }]) assert.equal(render('site', '/', options), '');
});
test('intensity limits count and pause/mobile preferences are reflected in decorative markup', () => {
  const low = render('site', '/', { paused: true });
  assert.equal((low.match(/class="seasonal-flying-bat/g) || []).length, 3);
  assert.equal((render('site', '/', { medium: true }).match(/class="seasonal-flying-bat/g) || []).length, 6);
  assert.match(low, /aria-hidden="true"/);
  assert.match(low, /seasonal-static/);
  assert.match(low, /seasonal-effect-desktop/);
});
