const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, imports = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>imports[name]});
 return exports;
}
const catalog=load('src/lib/pte-catalog.ts');
const nav=load('src/lib/student-navigation.ts',{'./pte-catalog':catalog});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name).replaceAll('\\','/')])}
const routes=walk('src/app').filter(file=>/\/page\.(tsx|ts|jsx|js)$/.test(file)).map(file=>file.replace(/^src\/app/,'').replace(/\/page\.[^.]+$/,'').replace(/\/\([^/]+\)/g,'')||'/');
function exists(href){const pathname=href.split(/[?#]/)[0];return routes.some(route=>new RegExp('^'+route.replace(/\[\.\.\.[^\]]+\]/g,'.+').replace(/\[[^\]]+\]/g,'[^/]+')+'$').test(pathname))}
for(const section of catalog.PTE_CATALOG)for(const task of section.tasks){const href=nav.taskHref(task);if(href){assert.ok(exists(href),`Missing trainer ${href}`);assert.equal(nav.examContext(href).skill,section.id)}}
for(const item of [...nav.studentNav,...nav.studentSearchItems])assert.ok(exists(item.href),`Missing navigation route ${item.href}`);
for(const [old,dest] of Object.entries(nav.legacyStudentDestinations)){assert.ok(exists(dest));assert.ok(!nav.legacyStudentDestinations[dest],`Redirect chain ${old}`);const source=fs.readFileSync(`src/app${old}/page.tsx`,'utf8');assert.ok(source.includes(`redirect('${dest}')`))}
assert.ok(nav.searchStudentTasks('ielts writing').some(item=>item.href==='/dashboard/ielts/writing'));
assert.ok(nav.searchStudentTasks('PTE dictation').some(item=>item.href==='/ai-wfd-practice'));
assert.equal(nav.examContext('/ai-ielts-essay-practice').exam,'ielts');
const findings=[];
for(const file of walk('src').filter(file=>/\.(tsx|ts)$/.test(file))){const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/href\s*[:=]\s*["'](\/[^"'{}]*)["']/g)){const href=match[1];if(source.slice(match.index+match[0].length).trimStart().startsWith('+'))continue;if(!href.startsWith('//')&&!exists(href)&&!href.startsWith('/api/')&&!fs.existsSync('public'+href.split(/[?#]/)[0]))findings.push({file,href})}}
fs.mkdirSync('docs/student-dashboard-redesign',{recursive:true});fs.writeFileSync('docs/student-dashboard-redesign/link-audit.json',JSON.stringify({note:'Static literal href audit. Dynamic links, access permissions and external links require separate verification. Findings may include intentional legacy links or endpoints.',routes:routes.length,findings},null,2));
console.log(`Passed: all live PTE trainers, student navigation, search and legacy redirects. Audited ${routes.length} routes; ${findings.length} other literal links need review.`);
