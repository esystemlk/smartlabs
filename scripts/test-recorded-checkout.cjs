const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
let pkg={title:'PTE course',published:true,tiers:[{months:2,price:20000},{months:3,price:28000}]},orders=[];
const db={collection:name=>({doc:id=>({get:async()=>name==='recorded_packages'?{exists:true,data:()=>pkg}:{data:()=>({displayName:'Example Student',email:'test@example.invalid'})}}),add:async data=>orders.push(data)})};
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/recorded-packages/create-payment/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports:exportsObject,console,process:{env:{NEXT_PUBLIC_PAYHERE_MERCHANT_ID:'test-merchant',PAYHERE_MERCHANT_SECRET:'isolated-test-secret',NEXT_PUBLIC_APP_URL:'https://example.invalid'}},require:name=>name==='@/lib/firebase-admin'?{adminDb:db,adminAuth:{verifyIdToken:async()=>({uid:'test-student'})}}:require(name)});
const request=body=>new Request('http://localhost/api/recorded-packages/create-payment',{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify(body)});
async function main(){
 assert.equal((await exportsObject.POST(new Request('http://localhost',{method:'POST'}))).status,401);
 assert.equal((await exportsObject.POST(request({packageId:'bad/path'}))).status,400);
 assert.equal((await exportsObject.POST(request({packageId:'course',months:10}))).status,400);
 assert.equal((await exportsObject.POST(request({packageId:'course',months:2,expectedPrice:1}))).status,409);
 const result=await(await exportsObject.POST(request({packageId:'course',months:3,price:1,expectedPrice:28000}))).json();assert.equal(result.params.amount,'28000.00');assert.equal(orders[0].paymentAmount,28000);assert.equal(orders[0].accessMonths,3);assert.equal(result.params.notify_url,'https://example.invalid/api/payhere/recorded-package-notify');assert.ok(result.params.hash);assert.equal(orders.length,1);
 pkg={...pkg,published:false};assert.equal((await exportsObject.POST(request({packageId:'course',months:2}))).status,409);assert.equal(orders.length,1);
 console.log('Passed: checkout auth, server-owned prices, selected access tier, changed-price guard, unpublished-package rejection and unchanged PayHere notification destination. No real payments or orders created.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
