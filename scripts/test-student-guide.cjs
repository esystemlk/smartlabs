const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript'),sharp=require('sharp');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/student-guide.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name).replaceAll('\\','/')])}
const routes=walk('src/app').filter(file=>/\/page\.(tsx|ts|jsx|js)$/.test(file)).map(file=>file.replace(/^src\/app/,'').replace(/\/page\.[^.]+$/,'').replace(/\/\([^/]+\)/g,'')||'/');
const sections=exportsObject.guideSections;
(async()=>{
 assert.equal(new Set(sections.map(section=>section.id)).size,sections.length,'Chapter anchors must be unique');
 let images=0,links=0;
 for(const section of sections){
  for(const link of section.links){assert.ok(routes.some(route=>new RegExp('^'+route.replace(/\[[^\]]+\]/g,'[^/]+')+'$').test(link.href)),`Missing guide destination ${link.href}`);links++}
  if(section.image){const image=section.image;assert.ok(image.alt.length>20,`Screenshot needs a useful description: ${section.id}`);const metadata=await sharp('public'+image.src).metadata();assert.equal(metadata.width,image.width,`Screenshot width: ${section.id}`);assert.equal(metadata.height,image.height,`Screenshot height: ${section.id}`);images++}
 }
 assert.ok(images>=8,'Key guide chapters must retain their screenshots');
 for(const file of ['src/app/guide/page.tsx','src/app/dashboard/guide/page.tsx'])assert.ok(fs.readFileSync(file,'utf8').includes('WebsiteGuide'),'Both guide routes must share the same content');
 console.log(`Passed: ${sections.length} chapter anchors, ${links} guide destinations and ${images} accessible screenshot assets. Both public and dashboard guide routes share the content.`);
})().catch(error=>{console.error(error.message);process.exitCode=1});
