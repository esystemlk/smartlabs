const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.join(__dirname,'..');
function compile(file,modules={}) {
  const output=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const context={exports:{},require:n=>{assert.ok(n in modules,`Unexpected dependency: ${n}`);return modules[n];},process:{env:modules.__env || {GOOGLE_GENAI_API_KEY_1:'fixture-only'}},fetch:modules.__fetch||fetch,AbortSignal,console,Request,Response,URL,File,Buffer,Date,setTimeout,clearTimeout};
  vm.runInNewContext(output,context);return context.exports;
}
const model=compile('src/lib/full-mock.ts');
const bank=fs.readdirSync(path.join(root,'mock-data/mock-1')).filter(f=>f.endsWith('.json')).flatMap(f=>{const b=JSON.parse(fs.readFileSync(path.join(root,'mock-data/mock-1',f)));return b.items.map(item=>({id:`${b.taskType}__${item.id}`,type:b.taskType,item}));}).sort((a,b)=>model.FULL_TASKS.findIndex(t=>t.type===a.type)-model.FULL_TASKS.findIndex(t=>t.type===b.type));
test('all 66 questions match the approved 22-task blueprint',()=> {
  assert.equal(bank.length,66);assert.equal(new Set(bank.map(q=>q.id)).size,66);
  model.FULL_TASKS.forEach(t=>assert.equal(bank.filter(q=>q.type===t.type).length,t.count));
});
test('weighted aggregation has correct endpoints and independent Overall',()=>{
  for(const percent of [0,100]) {const scores=model.aggregateFullScores(bank.map(q=>({type:q.type,score:{percent}})));Object.values(scores).forEach(s=>assert.equal(s,percent?90:10));}
  const scores=model.aggregateFullScores(bank.map(q=>({type:q.type,score:{percent:q.type==='write-essay'?100:0}})));
  assert.equal(scores.writing,35);assert.equal(scores.reading,10);
  const image=model.aggregateFullScores(bank.map(q=>({type:q.type,score:{percent:q.type==='describe-image'?100:0}})));
  assert.notEqual(image.overall,Math.round((image.writing+image.reading+image.listening+image.speaking)/4));
});
test('objective partial credit, penalties, adjacent pairs, and duplicates',()=>{
  const score=model.scoreObjective;
  assert.equal(score('mcq-multiple',{correctAnswers:['a','b']},['a','wrong']).raw,0);
  assert.equal(score('mcq-multiple',{correctAnswers:['a','b']},['a','a']).raw,1);
  assert.equal(score('reorder-paragraphs',{paragraphs:['a','b','c','d']},[2,3,0,1]).raw,2);
  assert.equal(score('reorder-paragraphs',{paragraphs:['a','b','c','d']},[0,1,0,1]).raw,0);
  assert.equal(score('reorder-paragraphs',{paragraphs:['a','b','c'],paragraphIds:['opaque-z','opaque-a','opaque-k']},['opaque-z','opaque-a','opaque-k']).raw,2);
  assert.equal(score('reorder-paragraphs',{paragraphs:['a','b','c'],paragraphIds:['opaque-z','opaque-a','opaque-k']},[0,1,2]).raw,0);
  assert.equal(score('highlight-incorrect-words',{transcript:['a','bad','c'],incorrectWords:['bad']},[0,1]).raw,0);
  assert.equal(score('listening-fill-blanks',{correctWords:['spelling','matters']},['speling','matters']).percent,50);
});
function setup({role='student',credits=1,missing=false,scoreFails=false,keys=true}={}) {
  const db=new Map();let serial=0,queue=Promise.resolve(),calls=0;
  db.set('users/u1',{role,mockPaidCredits:credits,essayPaidCredits:9,speakingPaidCredits:7});
  bank.forEach(q=>{if(missing&&q===bank[0])return;db.set(`pte_questions/${q.id}`,{taskType:q.type,data:q.item,audioUrl:'localPath' in q.item?'https://example.test/audio.mp3':null,imageUrl:q.type==='describe-image'?'https://example.test/image.png':null});});
  const snapshot=ref=>({exists:db.has(ref.key),id:ref.key.split('/').pop(),data:()=>db.get(ref.key)});
  const collection=key=>({doc:id=>reference(`${key}/${id||`auto${++serial}`}`),get:async()=>({docs:[...db.keys()].filter(k=>k.startsWith(key+'/')&&!k.slice(key.length+1).includes('/')).map(k=>snapshot(reference(k)))}),where:()=>({get:async()=>({docs:[]})})});
  const reference=key=>({key, id:key.split('/').pop(),collection:k=>collection(`${key}/${k}`),get:async()=>snapshot(reference(key)),update:async data=>db.set(key,{...db.get(key),...data}),set:async data=>db.set(key,data)});
  const adminDb={collection,getAll:async(...refs)=>refs.map(snapshot),runTransaction:fn=>{
    const result=queue.then(async()=>{const writes=[];const result=await fn({get:async ref=>snapshot(ref),set:(ref,data,options)=>writes.push(()=>db.set(ref.key,options?.merge?{...db.get(ref.key),...data}:data)),update:(ref,data)=>writes.push(()=>db.set(ref.key,{...db.get(ref.key),...data})),delete:ref=>writes.push(()=>db.delete(ref.key))});writes.forEach(w=>w());return result;});queue=result.catch(()=>{});return result;
  }};
  class NextResponse extends Response {static json(body,init){return new NextResponse(JSON.stringify(body),init);}}
  const auth={uid:'u1',role};
  const route=compile('src/app/api/full-mock/route.ts',{
    __env:keys?{GOOGLE_GENAI_API_KEY_1:'fixture-only'}:{},
    'next/server':{NextResponse},crypto:require('crypto'),'firebase-admin':{storage:()=>({bucket:()=>({file:()=>({getSignedUrl:async()=>['https://example.test/recording']})})})},
    '@/lib/firebase-admin':{adminDb},'@/lib/api-auth':{verifyAuthed:async()=>({ok:true,...auth})},
    '@/lib/mock-credits':{getMockCredits:async()=>({remaining:credits,unlimited:false})},'@/lib/mock-packages':{FREE_MOCK_LIMIT:0},
    '@/lib/full-mock-bank':{FULL_BANK:bank},'@/lib/full-mock':model,
    '@/lib/mock-ai-context':{hasMockAiKey:()=>keys},
    '@/lib/full-mock-scoring':{scoreFullQuestion:async()=>{calls++;if(scoreFails)throw new Error('Simulated AI outage');return {raw:1,max:1,percent:100};}},
  });
  const post=async body=>route.POST(new Request('http://test/api/full-mock',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)}));
  const get=id=>route.GET(new Request(`http://test/api/full-mock?attemptId=${id}`,{headers:{Authorization:'Bearer test'}}));
  return {db,post,get,auth,get calls(){return calls;}};
}
test('concurrent starts consume exactly one mock credit; no AI pools touched',async()=>{
  const h=setup();const responses=await Promise.all([h.post({action:'start'}),h.post({action:'start'})]);
  const [a,b]=await Promise.all(responses.map(r=>r.json()));assert.equal(a.id,b.id);assert.equal(a.total,66);
  const user=h.db.get('users/u1');assert.equal(user.mockPaidCredits,0);assert.equal(user.essayPaidCredits,9);assert.equal(user.speakingPaidCredits,7);
  assert.equal((await h.post({action:'start'})).status,200);assert.equal(h.db.get('users/u1').mockPaidCredits,0);
});
test('zero credits and incomplete bank do not create an attempt or debit',async()=>{
  for(const options of [{credits:0},{missing:true}]){const h=setup(options);assert.equal((await h.post({action:'start'})).status,options.missing?409:402);assert.equal([...h.db.keys()].filter(k=>k.startsWith('pte_full_mock_attempts/')).length,0);assert.equal(h.db.get('users/u1').mockPaidCredits,options.credits??1);}
});
test('missing AI configuration never consumes a paid mock credit',async()=>{
  const h=setup({keys:false});assert.equal((await h.post({action:'start'})).status,503);
  assert.equal(h.db.get('users/u1').mockPaidCredits,1);assert.equal([...h.db.keys()].some(k=>k.startsWith('pte_full_mock_attempts/')),false);
});
test('answers freeze on Next; future indices cannot skip questions; no live answer keys',async()=>{
  const h=setup();const a=await (await h.post({action:'start'})).json();
  await h.post({action:'save',attemptId:a.id,index:0,answer:'first',advance:true});
  await h.post({action:'save',attemptId:a.id,index:0,answer:'tampered'});
  await h.post({action:'save',attemptId:a.id,index:8,answer:'future',advance:true});
  assert.equal(h.db.get(`pte_full_mock_attempts/${a.id}/responses/0`).answer,'first');
  const current=await (await h.get(a.id)).json();assert.equal(current.current,1);assert.equal(typeof current.question.text,'string');assert.equal(current.question.data,undefined);assert.equal(current.review,undefined);assert.equal(current.question.answer,'');
  h.db.get(`pte_full_mock_attempts/${a.id}`).current=5;
  const repeat=await (await h.get(a.id)).json();assert.equal(repeat.question.type,'repeat-sentence');assert.equal(repeat.question.text,undefined);
});
test('background scoring is cached, retries do not debit, and unfinished results are blocked',async()=>{
  const h=setup();const a=await (await h.post({action:'start'})).json();
  assert.equal((await h.post({action:'score',attemptId:a.id,index:0})).status,400);
  await h.post({action:'save',attemptId:a.id,index:0,answer:'',advance:true});
  await Promise.all([h.post({action:'score',attemptId:a.id,index:0}),h.post({action:'score',attemptId:a.id,index:0})]);
  await h.post({action:'score',attemptId:a.id,index:0});assert.equal(h.calls,1);
  assert.equal(h.db.get('users/u1').mockPaidCredits,0);assert.equal((await h.post({action:'finish',attemptId:a.id})).status,409);
});
test('AI failure releases its lease and preserves retryable saved answers',async()=>{
  const h=setup({scoreFails:true});const a=await (await h.post({action:'start'})).json();
  await h.post({action:'save',attemptId:a.id,index:0,answer:'saved',advance:true});
  assert.equal((await h.post({action:'score',attemptId:a.id,index:0})).status,503);
  assert.equal((await h.post({action:'score',attemptId:a.id,index:0})).status,503);assert.equal(h.calls,2);
  assert.equal(h.db.get(`pte_full_mock_attempts/${a.id}/responses/0`).answer,'saved');assert.equal(h.db.get('users/u1').mockPaidCredits,0);
});
test('ownership and staff-only lecturer notes are enforced',async()=>{
  const h=setup();const a=await (await h.post({action:'start'})).json();h.auth.uid='intruder';
  assert.equal((await h.get(a.id)).status,403);h.auth.uid='u1';
  assert.equal((await h.post({action:'note',attemptId:a.id,index:0,note:'x'})).status,403);
});
test('expired attempts close; skipped questions remain pending until assessed',async()=>{
  const h=setup();const a=await (await h.post({action:'start'})).json();h.db.get(`pte_full_mock_attempts/${a.id}`).expiresAt=1;
  const d=await (await h.get(a.id)).json();assert.equal(d.status,'submitted');assert.equal(d.current,66);assert.equal(d.pending.length,66);
});
test('all 66 responses can finish and produce a complete, reviewable report',async()=>{
  const h=setup();const a=await (await h.post({action:'start'})).json();
  for(let i=0;i<66;i++) {
    const saved=await h.post({action:'save',attemptId:a.id,index:i,answer:'response',advance:true});assert.equal(saved.status,200);
    assert.equal((await h.post({action:'score',attemptId:a.id,index:i})).status,200);
  }
  const response=await h.post({action:'finish',attemptId:a.id});assert.equal(response.status,200);
  const d=await response.json();assert.equal(d.status,'scored');assert.equal(d.review.length,66);assert.equal(d.pending.length,0);Object.values(d.results).forEach(v=>assert.equal(v,90));
  h.auth.role='teacher';
  assert.equal((await h.post({action:'note',attemptId:a.id,index:0,note:'Work on phrase stress.'})).status,200);
  const reviewed=await (await h.get(a.id)).json();assert.equal(reviewed.canAnnotate,true);assert.equal(reviewed.review[0].lecturerNote,'Work on phrase stress.');
  assert.equal(h.db.get('users/u1').mockPaidCredits,0);
});
test('mock adapters preserve existing speaking and writing marks without extra gates',async()=>{
  const speaking={overall:66,content:0,fluency:88,pronunciation:80,transcript:'Actual response',tips:['Existing tip']};
  const writing={total:7,maxTotal:9,scores:{content:0,form:0},feedback:'Existing engine feedback'};
  const essay={criteria:[{name:'Content',score:4,max:6},{name:'Form',score:2,max:2}],feedback:'Existing essay feedback'};
  const headers=[];
  const handler=kind=>async req=>{headers.push(req.headers.get('x-internal-token'));return Response.json(kind==='essay'?essay:writing);};
  const scoring=compile('src/lib/full-mock-scoring.ts',{
    '@/app/api/score-essay/route':{POST:handler('essay')},'@/app/api/score-swt/route':{POST:handler('swt')},'@/app/api/score-sst/route':{POST:handler('sst')},
    '@/lib/internal-auth':{internalHeaders:()=>({'x-internal-token':'server-only'})},
    '@/ai/flows/score-pte-speaking':{scorePteSpeaking:async()=>speaking},'@/lib/wfd-scoring':{scoreWfd:()=>({correctWords:2,totalWords:4,accuracy:50})},
    '@/lib/full-mock':model,'@/lib/full-mock-reference':{repeatSentenceReference:async()=> 'Reference sentence'},
    '@/lib/mock-ai-context':{withMockAiKey:fn=>fn()},
    'firebase-admin':{storage:()=>({bucket:()=>({file:()=>({download:async()=>[Buffer.from('audio')],getMetadata:async()=>[{contentType:'audio/webm'}]})})})},
  });
  const s=await scoring.scoreFullQuestion('read-aloud',{data:{text:'Reference'}},'','owned/path','Bearer test');
  assert.equal(s.raw,66);assert.equal(s.percent,70);assert.equal(s.detail,speaking);
  const w=await scoring.scoreFullQuestion('swt',{data:{passage:'Passage'}},'My summary',undefined,'Bearer test');
  assert.equal(w.raw,7);assert.equal(w.max,9);assert.equal(w.detail.feedback,writing.feedback);
  const e=await scoring.scoreFullQuestion('write-essay',{data:{topic:'Topic'}},'My essay',undefined,'Bearer test');
  assert.equal(e.raw,6);assert.equal(e.max,8);assert.equal(e.detail.feedback,essay.feedback);
  assert.deepEqual(headers,['server-only','server-only']);
});
test('key 6 is isolated across concurrent mock and individual requests with no fallback',async()=>{
  const env={GOOGLE_GENAI_API_KEY_1:'practice-one',GOOGLE_GENAI_API_KEY_2:'practice-two',GOOGLE_GENAI_API_KEY_6:'mock-six'};
  const context=compile('src/lib/mock-ai-context.ts',{'node:async_hooks':require('node:async_hooks'),__env:env});
  const logged=[];
  const engine=compile('src/ai/genkit.ts',{
    __env:env,'@/lib/mock-ai-context':context,
    genkit:{genkit:options=>({apiKey:options.plugins[0].apiKey})},'@genkit-ai/googleai':{googleAI:options=>options},
    '@/lib/services/ai-usage.service':{logAiCall:async row=>logged.push(row)},
  });
  const [mock,practice]=await Promise.all([
    context.withMockAiKey(()=>engine.callWithFallback(async ai=>{await new Promise(r=>setTimeout(r,10));assert.equal(context.currentMockAiKey(),'mock-six');return ai.apiKey;})),
    engine.callWithFallback(async ai=>{assert.equal(context.currentMockAiKey(),undefined);return ai.apiKey;}),
  ]);
  assert.equal(mock,'mock-six');assert.equal(practice,'practice-one');assert.equal(context.currentMockAiKey(),undefined);
  assert.ok(logged.some(row=>row.keyIndex===6&&row.keyLabel==='KEY_6'));
  const attempted=[];
  await assert.rejects(context.withMockAiKey(()=>engine.callWithFallback(async ai=>{attempted.push(ai.apiKey);throw new Error('Invalid test key');})),/Invalid test key/);
  assert.deepEqual(attempted,['mock-six']);
  delete env.GOOGLE_GENAI_API_KEY_6;
  assert.throws(()=>context.withMockAiKey(async()=>{}),/key 6 is not configured/);
});
test('existing writing REST transport also uses only key 6 for mock requests',async()=>{
  const env={GOOGLE_GENAI_API_KEY_1:'practice-one',GOOGLE_GENAI_API_KEY_6:'mock-six'};
  const context=compile('src/lib/mock-ai-context.ts',{'node:async_hooks':require('node:async_hooks'),__env:env});
  const urls=[];
  const transport=compile('src/lib/gemini-fetch.ts',{
    __env:env,'@/lib/mock-ai-context':context,
    __fetch:async url=>{urls.push(url);return Response.json({candidates:[{content:{parts:[{text:'{"score":1}'}]}}]});},
  });
  const opts={contents:[],models:[{name:'test-model',api:'v1beta'}]};
  const [mock,practice]=await Promise.all([context.withMockAiKey(()=>transport.generateWithFailover(opts)),transport.generateWithFailover(opts)]);
  assert.equal(mock.keyIndex,6);assert.equal(mock.keyLabel,'KEY_6');assert.equal(practice.keyIndex,1);
  assert.ok(urls[0].includes('mock-six'));assert.ok(urls[1].includes('practice-one'));
});
