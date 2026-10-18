const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/seasonal-theme/contrast.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: exported });
const { parseColour: c, compositeColour: over, colourContrast: ratio, readableColour: readable, isLightNeutral } = exported;
test('dark lettering on bright seasonal buttons is preserved', () => {
  const dark = c('#160F24'), orange = c('#FF9A3D');
  assert.equal(readable(dark, [orange]), dark);
  assert.ok(ratio(dark, orange) > 4.5);
});
test('white lettering on bright orange is corrected', () => {
  const orange = c('#FF9A3D'), result = readable(c('#FFFFFF'), [orange]);
  assert.ok(result); assert.ok(ratio(result, orange) >= 4.5);
});
test('fixed dark text on a dark card becomes readable', () => {
  const card = c('#261A38'), result = readable(c('#0F172A'), [card]);
  assert.ok(result); assert.ok(ratio(result, card) >= 4.5);
});
test('translucent text and surfaces are composed before checking contrast', () => {
  const card = over(c('rgba(255, 255, 255, 0.1)'), c('#160F24'));
  const result = readable(c('rgba(255, 255, 255, 0.3)'), [card]);
  assert.ok(result); assert.ok(ratio(result, card) >= 4.5);
});
test('neutral paper surfaces are distinguished from coloured action/status surfaces', () => {
  assert.equal(isLightNeutral(c('rgba(248,250,252,0.5)')), true);
  assert.equal(isLightNeutral(c('#FFFFFF')), true);
  assert.equal(isLightNeutral(c('#FF9A3D')), false);
  assert.equal(isLightNeutral(c('#261A38')), false);
  assert.equal(isLightNeutral(c('rgba(255,255,255,0.05)')), false);
});
test('mixed light/dark gradients request an explicit readable text backplate', () => {
  assert.equal(readable(c('#777777'), [c('#000000'), c('#FFFFFF')]), null);
});
