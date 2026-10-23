'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { FULL_TASKS, PARTS, SKILLS, speakingTask, type FullAnswer } from '@/lib/full-mock';
import { ArrowRight, Check, Clock3, Headphones, Mic, Volume2, ShieldCheck, Sparkles, ChevronUp, ChevronDown, Save, Loader2, AlertCircle, BookOpen, Award, ArrowLeft } from 'lucide-react';
import { FullMockReport } from '@/components/mock/FullMockReport';

const clock = (n: number) => `${Math.floor(Math.max(0,n)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,n)%60).toString().padStart(2,'0')}`;
const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed';
const outline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40';
type Screen = 'welcome' | 'instructions' | 'headphones' | 'microphone' | 'tips' | 'introduction' | 'ready' | 'exam' | 'marking' | 'results';
const STEPS: Screen[] = ['welcome','instructions','headphones','microphone','tips','introduction','ready'];
export default function FullMockPage() {
  const {user,isUserLoading} = useUser();
  const [screen,setScreen] = useState<Screen>('welcome');
  const [meta,setMeta] = useState<any>(null);
  const [exam,setExam] = useState<any>(null);
  const [answer,setAnswer] = useState<FullAnswer>('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [now,setNow] = useState(Date.now());
  const [deviceReady,setDeviceReady] = useState(false);
  const [heard,setHeard] = useState(false);
  const [recording,setRecording] = useState(false);
  const [sample,setSample] = useState('');
  const [level,setLevel] = useState(0);
  const [stage,setStage] = useState('');
  const [saveStatus,setSaveStatus] = useState('All changes saved');
  const [marked,setMarked] = useState(0);
  const [markingError,setMarkingError] = useState('');
  const [introPhase,setIntroPhase] = useState('preparing');
  const introStart = useRef(0);
  const answerRef = useRef<FullAnswer>(''); const examRef = useRef<any>(null);
  const stream = useRef<MediaStream | null>(null); const recorder = useRef<MediaRecorder | null>(null);
  const blob = useRef<Blob | null>(null); const stopping = useRef<Promise<Blob> | null>(null);
  const lastIndex = useRef(-1); const moving = useRef(false); const queue = useRef<number[]>([]);
  const working = useRef(false); const skew = useRef(0); const audio = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef(''); const autoRecord = useRef(false); const playedHere = useRef(false);
  const introTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = useCallback(async (body?: any, id?: string, form?: FormData) => {
    if (!user) throw new Error('Sign in to take the mock test.');
    const token = await user.getIdToken();
    const res = await fetch(`/api/full-mock${id ? `?attemptId=${encodeURIComponent(id)}` : ''}`, {
      method: body || form ? 'POST' : 'GET', headers: { Authorization:`Bearer ${token}`, ...(!form ? {'Content-Type':'application/json'} : {}) },
      ...(body || form ? {body:form || JSON.stringify(body)} : {}),
    });
    const d = await res.json(); if (!res.ok) throw new Error(d.error || 'Please try again.'); return d;
  },[user]);
  const change = (value: FullAnswer) => { answerRef.current=value; setAnswer(value); setSaveStatus('Saving…'); };
  const apply = useCallback((d: any) => {
    skew.current=d.serverNow-Date.now(); examRef.current=d; setExam(d);
    queue.current=d.pending || []; setMarked(d.scored || 0);
    if (lastIndex.current !== d.current) {
      lastIndex.current=d.current; answerRef.current=d.question?.answer ?? ''; setAnswer(answerRef.current);
      blob.current=null; stopping.current=null; autoRecord.current=false; playedHere.current=false; setStage(''); stageRef.current='';
    }
    setScreen(d.status === 'scored' ? 'results' : d.status === 'submitted' ? 'marking' : 'exam');
  },[]);
  useEffect(()=> { if(user) api().then(setMeta).catch(e=>setError(e.message)); },[user,api]);
  useEffect(()=> { if(!user)return;const id=new URLSearchParams(window.location.search).get('attemptId');if(id)api(undefined,id).then(apply).catch(e=>setError(e.message)); },[user,api,apply]);
  useEffect(()=> { const t=setInterval(()=>setNow(Date.now()+skew.current),250); return ()=>clearInterval(t); },[]);
  useEffect(()=>()=> { stream.current?.getTracks().forEach(t=>t.stop()); if (introTimer.current) clearTimeout(introTimer.current); },[]);
  useEffect(()=> { const fn=(e: BeforeUnloadEvent)=> { if(examRef.current?.status==='in_progress'){e.preventDefault();e.returnValue='';} }; window.addEventListener('beforeunload',fn); return ()=>window.removeEventListener('beforeunload',fn); },[]);

  const connectMic = async () => {
    if (stream.current?.active) return stream.current;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Use a browser with microphone recording support over HTTPS.');
    stream.current=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    setDeviceReady(true); return stream.current;
  };
  const startRecording = async () => {
    try {
      const s=await connectMic(); const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));
      const r=new MediaRecorder(s,mime ? {mimeType:mime} : undefined); recorder.current=r; const chunks: BlobPart[]=[];
      r.ondataavailable=e=> { if(e.data.size) chunks.push(e.data); };
      stopping.current=new Promise<Blob>(resolve=> { r.onstop=()=> { const b=new Blob(chunks,{type:r.mimeType || 'audio/webm'}); blob.current=b; setRecording(false); resolve(b); }; });
      r.start(500); setRecording(true);
      // A real microphone level meter, local to this browser.
      const context=new AudioContext(); const source=context.createMediaStreamSource(s); const analyser=context.createAnalyser(); analyser.fftSize=256; source.connect(analyser);
      const data=new Uint8Array(analyser.frequencyBinCount);
      const meter=setInterval(()=> { analyser.getByteFrequencyData(data); setLevel(Math.min(100,data.reduce((a,b)=>a+b,0)/data.length*2)); },100);
      r.addEventListener('stop',()=> {clearInterval(meter); void context.close(); setLevel(0);},{once:true});
    } catch(e) {setError(e instanceof Error ? e.message : 'Microphone access failed.'); setStage('microphone-error'); stageRef.current='microphone-error';}
  };
  const stopRecording = async () => {
    if(recorder.current?.state==='recording') recorder.current.stop();
    return stopping.current ? await stopping.current : blob.current;
  };
  const sampleRecord = async () => {
    if(recording) {
      const b=await stopRecording(); if(b) {if(sample)URL.revokeObjectURL(sample);setSample(URL.createObjectURL(b));}
    } else await startRecording();
  };
  useEffect(()=> {
    if(screen!=='introduction')return;
    introStart.current=Date.now();setIntroPhase('preparing');
    const prepare=setTimeout(()=>{setIntroPhase('recording');void startRecording();},25000);
    const finish=setTimeout(()=>{void stopRecording().then(b=>{if(b)setSample(URL.createObjectURL(b));setIntroPhase('done');});},55000);
    return()=>{clearTimeout(prepare);clearTimeout(finish);};
  },[screen]);
  const begin = async (resume = false) => {
    setBusy(true);setError('');
    try { await connectMic(); const d=resume && meta?.attemptId ? await api(undefined,meta.attemptId) : await api({action:'start'}); apply(d); }
    catch(e){setError((e as Error).message);} finally {setBusy(false);}
  };
  const advance = useCallback(async () => {
    if(moving.current || !examRef.current?.question) return;
    moving.current=true;setBusy(true);setError('');
    try {
      const ex=examRef.current;
      if(speakingTask(ex.question.type)) {
        const b=await stopRecording();
        if(b?.size) { const form=new FormData();form.set('attemptId',ex.id);form.set('index',String(ex.current));form.set('audio',b,'response.webm'); await api(undefined,undefined,form); }
      }
      const d=await api({action:'save',attemptId:ex.id,index:ex.current,answer:answerRef.current,advance:true});
      apply(d);setSaveStatus('All changes saved');
    }catch(e){setError((e as Error).message);}finally{moving.current=false;setBusy(false);}
  },[api,apply]); // refs keep the recording and current answer available to timer callbacks

  // Durable, bounded background scoring: each request is awaited by the server before returning.
  // Only one AI worker runs per attempt; a server lease also protects across tabs.
  useEffect(()=> {
    if(!exam?.id || !['exam','marking'].includes(screen))return;
    let cancelled=false;
    const tick=async()=> {
      if(working.current || cancelled)return;
      working.current=true;
      try {
        const ex=examRef.current;
        const index=queue.current[0];
        if(index!==undefined) {
          await api({action:'score',attemptId:ex.id,index});
          const d=await api(undefined,ex.id);
          queue.current=d.pending;setMarked(d.scored);setMarkingError('');
          if(d.current!==examRef.current.current || d.status!==examRef.current.status) apply(d);
        } else if(ex.status==='submitted') { const d=await api({action:'finish',attemptId:ex.id});apply(d); }
      }catch(e){setMarkingError((e as Error).message);}finally{working.current=false;}
    };
    void tick();const t=setInterval(()=>void tick(),4000);return()=>{cancelled=true;clearInterval(t);};
  },[exam?.id,screen,api,apply]);

  useEffect(()=> {
    if(screen!=='exam' || !exam?.question)return;
    const t=setInterval(async()=> {
      if(moving.current || speakingTask(examRef.current.question.type))return;
      try {await api({action:'save',attemptId:examRef.current.id,index:examRef.current.current,answer:answerRef.current});setSaveStatus('All changes saved');}
      catch{setSaveStatus('Connection interrupted · retrying');}
    },3000);return()=>clearInterval(t);
  },[screen,exam?.current,api]);

  const referenceEnded = async () => {
    if(!speakingTask(examRef.current.question.type))return;
    try { const d=await api({action:'respond',attemptId:examRef.current.id,index:examRef.current.current});apply(d); }
    catch(e){setError((e as Error).message);}
  };
  const playReference = async () => {
    const ex=examRef.current;
    if(playedHere.current || ex.question.played)return;
    playedHere.current=true;setStage('listening');stageRef.current='listening';
    try {await api({action:'play',attemptId:ex.id,index:ex.current});await audio.current?.play();}
    catch{setError('Audio could not start. Click “Continue audio” below.');setStage('audio-blocked');stageRef.current='audio-blocked';}
  };
  useEffect(()=> {
    if(screen!=='exam' || !exam?.question)return;
    const q=exam.question;
    if(q.audioUrl && !q.played && !playedHere.current) {void playReference();return;}
    if(speakingTask(q.type)) {
      if(q.audioUrl && !q.responseStartsAt) {if(q.played && !playedHere.current)setStage('audio-interrupted');return;}
      const spec=FULL_TASKS.find(t=>t.type===q.type)!;
      const starts=q.responseStartsAt || exam.questionStartedAt+spec.prepare*1000;
      if(now<starts){setStage('preparing');stageRef.current='preparing';}
      else if(!autoRecord.current){autoRecord.current=true;setStage('recording');stageRef.current='recording';void startRecording();}
    }
    if(now>=Math.min(exam.questionEndsAt,exam.partEndsAt) && !moving.current)void advance();
  },[screen,exam?.current,exam?.question?.responseStartsAt,now,advance]);

  const q=exam?.question; const spec=FULL_TASKS.find(t=>t.type===q?.type);
  const step=STEPS.indexOf(screen);
  const title=screen==='exam' ? spec?.label : screen==='marking' ? 'Finishing your score report' : screen==='results' ? 'Your performance, explained' : ({welcome:'Your next step towards test day.',instructions:'Know what to expect.',headphones:'Find your listening sweet spot.',microphone:'Let’s hear you clearly.',tips:'A little preparation goes a long way.',introduction:'Start with a short introduction.',ready:'You’re ready. Make it count.'} as any)[screen];
  return <main className="min-h-screen bg-[#f5f6fa] text-slate-900">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><Link href="/mock-tests" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-black text-white">S</span><span className="font-bold tracking-tight">SMART LABS<span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">PTE Academic · Full Mock 01</span></span></Link><div className="flex items-center gap-4 text-sm">{screen==='exam' ? <><span className="hidden text-slate-500 sm:block">Part {q?.part+1} of 3</span><span className="rounded-xl bg-slate-900 px-4 py-2 font-mono text-white"><Clock3 className="mr-2 inline h-4 w-4"/>{clock((exam.partEndsAt-now)/1000)}</span></> : <span className="flex items-center gap-2 text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Exam workspace</span>}</div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
      {error && <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="h-5 w-5"/>{error}<button onClick={()=>setError('')} className="ml-auto underline">Dismiss</button><Link href="/mock-tests" className="underline">Mock credits</Link></div>}
      {!user && !isUserLoading ? <div className="rounded-3xl bg-white p-12 text-center"><h1 className="text-3xl font-bold">Sign in to take your full mock</h1><p className="my-5 text-slate-500">Your answers, recordings, and report stay connected to your account.</p><Link className={button} href="/login?redirect=/mock/full-1">Sign in <ArrowRight className="h-4 w-4"/></Link></div> : <>
      {step>=0 && <div className="mb-10 flex gap-2" aria-label={`Preparation step ${step+1} of ${STEPS.length}`}>{STEPS.map((s,i)=><div key={s} className={`h-1.5 flex-1 rounded-full ${i<=step?'bg-violet-600':'bg-slate-200'}`}/>)}</div>}
      {screen!=='results' && <div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">{step>=0?`Before you begin / 0${step+1}`:screen==='exam'?`${PARTS[q?.part || 0].label} / Question ${exam.current+1} of ${exam.total}`:'Background marking'}</p><h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1></div>}
      {screen==='welcome' && <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><section className="rounded-3xl bg-slate-900 p-8 text-white md:p-10"><div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs"><Sparkles className="h-3 w-3"/> A complete rehearsal. Useful feedback.</div><h2 className="text-3xl font-semibold leading-tight">Three sections.<br/>Four skills.<br/><span className="text-violet-300">One clearer picture.</span></h2><p className="my-6 max-w-lg leading-7 text-slate-300">Work through all 66 collected questions with timed responses, automatic audio, and AI assessment. Your report turns each answer into a practical learning opportunity.</p><div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">{[['66','questions'],['22','task types'],['1','mock credit']].map(([n,l])=><div key={l}><strong className="text-3xl">{n}</strong><p className="mt-1 text-xs text-slate-400">{l}</p></div>)}</div></section><aside className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="mb-6 text-lg font-bold">Your test at a glance</h2>{PARTS.map((p,i)=><div key={p.label} className="flex items-center gap-4 border-b border-slate-100 py-5"><span className="text-lg font-semibold text-violet-400">0{i+1}</span><div><p className="font-semibold">{p.label}</p><p className="mt-1 text-sm text-slate-500">{[35,16,15][i]} questions · up to {p.seconds/60} min</p></div></div>)}<p className="mt-6 text-sm leading-6 text-slate-500">Allow about 2 hours 40 minutes, plus setup. Scoring is included. No individual AI credits are deducted.</p>{meta?.attemptId && <button className={`${outline} mt-5 w-full`} disabled={busy} onClick={()=>void begin(true)}>Resume / view latest attempt <ArrowRight className="h-4 w-4"/></button>}{meta?.history?.filter((h:any)=>h.status==='scored').slice(0,3).map((h:any)=><button key={h.id} className="mt-3 block text-sm text-violet-700 underline" onClick={()=>api(undefined,h.id).then(apply).catch(e=>setError(e.message))}>Report · {new Date(h.createdAt).toLocaleDateString()} · Overall {h.results?.overall}</button>)}</aside></div>}
      {screen==='instructions' && <div className="grid gap-5 md:grid-cols-2">{[['Follow the sequence','Answer each question in order. After Next, you cannot go back. Reading and most Listening tasks share their section clock.'],['Listen once','Exam audio plays automatically once. Refreshing does not give another play. Keep your headset on for listening and speaking.'],['Keep your work safe','Written answers save automatically. Recordings upload before you move on. Timers continue if you leave or refresh.'],['One mock credit covers the test','A credit is used only when you start. Resuming and retrying assessment use the same attempt. Single AI practice credits are never charged.']].map(([h,p],i)=><div key={h} className="rounded-2xl border border-slate-200 bg-white p-7"><span className="text-sm font-bold text-violet-500">0{i+1}</span><h2 className="mb-3 mt-4 text-xl font-semibold">{h}</h2><p className="leading-7 text-slate-500">{p}</p></div>)}</div>}
      {screen==='headphones' && <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center"><Headphones className="mx-auto mb-6 h-16 w-16 text-violet-500"/><h2 className="text-2xl font-semibold">Check both ears. Set a comfortable volume.</h2><p className="my-5 leading-7 text-slate-500">Play the test tone. You should hear a clear, gentle sound through your headphones.</p><button className={button} onClick={async()=>{const ctx=new AudioContext();await ctx.resume();const o=ctx.createOscillator();const gain=ctx.createGain();gain.gain.value=0.08;o.connect(gain);gain.connect(ctx.destination);o.frequency.value=440;o.start();o.stop(ctx.currentTime+1);o.onended=()=>void ctx.close();}}><Volume2 className="h-4 w-4"/> Play test sound</button><label className="mt-8 flex items-center justify-center gap-3 text-sm"><input type="checkbox" checked={heard} onChange={e=>setHeard(e.target.checked)}/> I heard the sound clearly</label></div>}
      {(screen==='microphone'||screen==='introduction') && <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 md:p-10"><Mic className="mb-6 h-12 w-12 text-violet-500"/><h2 className="text-2xl font-semibold">{screen==='microphone'?'Speak, listen, adjust.':'Tell us a little about yourself.'}</h2><p className="my-5 leading-7 text-slate-500">{screen==='microphone'?'Record “Testing, testing, one, two, three.” Play it back and check that your voice is clear, without clipping.':'Mention your interests, study plans, or reasons for learning English. This introduction is unscored and stays on this device.'}</p><div className="my-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-400 transition-all" style={{width:`${level}%`}}/></div>{screen==='microphone'?<button className={button} onClick={()=>void sampleRecord()}>{recording?'Stop recording':'Record a sample'}<Mic className="h-4 w-4"/></button>:<p className="font-mono text-xl text-violet-700">{introPhase==='done'?'Introduction complete':introPhase==='preparing'?`Recording in ${clock((introStart.current+25000-now)/1000)}`:`Recording · ${clock((introStart.current+55000-now)/1000)} remaining`}</p>}{sample&&<audio controls src={sample} className="mt-6 w-full"/>}{deviceReady&&<p className="mt-4 text-sm text-emerald-700"><Check className="mr-2 inline h-4 w-4"/> Microphone connected</p>}</div>}
      {screen==='tips' && <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12"><div className="grid gap-8 md:grid-cols-3">{[['Speak naturally','Use clear phrases and a steady pace. Focus on intelligibility; you do not need to imitate a particular accent.'],['Manage your time','Keep an eye on the section clock. Reading questions share time, so leave enough for the remaining items.'],['Write with purpose','Read each prompt carefully. Follow word limits, check spelling, and answer the task in your own words.']].map(([h,p])=><div key={h}><h2 className="mb-4 text-xl font-semibold">{h}</h2><p className="leading-7 text-slate-500">{p}</p></div>)}</div></div>}
      {screen==='ready' && <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="mb-5 text-xl font-bold">Your full test sequence</h2>{PARTS.map((p,i)=><details key={p.label} open={i===0} className="border-b border-slate-100 py-4"><summary className="cursor-pointer font-semibold">{p.label} <span className="float-right text-sm text-slate-400">{[35,16,15][i]} questions</span></summary><div className="mt-4 grid gap-2 sm:grid-cols-2">{FULL_TASKS.filter(t=>t.part===i).map(t=><p key={t.type} className="text-sm text-slate-500">{t.label} <span className="font-bold text-slate-800">×{t.count}</span></p>)}</div></details>)}</div><div className="rounded-3xl bg-violet-50 p-8"><ShieldCheck className="mb-5 h-10 w-10 text-violet-600"/><h2 className="text-2xl font-semibold">Everything in place.</h2><p className="my-5 leading-7 text-slate-600">Starting begins the test clock and uses one mock credit. Choose a quiet space and keep this tab open.</p><p className="mb-6 font-semibold">{meta?.credits?.unlimited?'Unlimited mock access':`${meta?.credits?.remaining ?? '…'} mock credits available`}</p><button className={`${button} w-full`} disabled={busy||!meta||meta.aiReady===false||(!meta.credits.unlimited && meta.credits.remaining<1)} onClick={()=>void begin()}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<>Start full mock <ArrowRight className="h-4 w-4"/></>}</button>{meta?.aiReady===false&&<p className="mt-4 text-sm text-amber-800">AI marking is temporarily unavailable. Please return later; no credit has been used.</p>}<Link className="mt-4 block text-center text-sm text-violet-700 underline" href="/mock-tests">Get mock credits</Link></div></div>}
      {screen==='exam' && q && <div className="grid gap-6 lg:grid-cols-[1fr_260px]"><section className="min-h-[480px] rounded-3xl border border-slate-200 bg-white p-6 md:p-10" key={exam.current}><p className="mb-6 text-sm leading-6 text-slate-500">{instructions(q.type)}</p>{q.audioUrl&&<><audio ref={audio} src={q.audioUrl} preload="auto" onEnded={()=>void referenceEnded()} onError={()=>setError('The question audio could not load. Your answer is preserved; check your connection.')} /><div className="mb-7 flex flex-wrap items-center gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800"><Headphones className="h-5 w-5"/>{stage==='listening'?'Listening · audio plays once':q.played?'Audio play used':'Audio starts automatically'}{stage==='audio-blocked'&&<button className="underline" onClick={()=>{audio.current?.play().then(()=>{setStage('listening');setError('');}).catch(()=>setError('Check your audio device and try again.'));}}>Continue audio</button>}{stage==='audio-interrupted'&&<button className="underline" onClick={()=>void referenceEnded()}>Continue to response (audio cannot replay)</button>}</div></>}
        {speakingTask(q.type)&&<div className={`mb-7 flex items-center justify-between rounded-2xl p-5 ${recording?'bg-rose-50 text-rose-700':'bg-slate-50'}`}><div className="flex items-center gap-3"><Mic className={`h-5 w-5 ${recording?'animate-pulse':''}`}/><span className="font-semibold">{recording?'Recording your response':stage==='preparing'?'Prepare your response':stage==='listening'?'Listen carefully':'Microphone ready'}</span></div><span className="font-mono text-xl">{stage==='preparing'?clock(((q.responseStartsAt||exam.questionStartedAt+(spec?.prepare||0)*1000)-now)/1000):clock((exam.questionEndsAt-now)/1000)}</span></div>}
        {q.imageUrl&&<img src={q.imageUrl} alt="Describe the information in this question image" className="mx-auto max-h-[460px] max-w-full object-contain"/>}
        {['rw-fill-blanks','fill-blanks','listening-fill-blanks'].includes(q.type)?<BlankQuestion q={q} answer={answer} change={change}/>:q.type==='reorder-paragraphs'?<ReorderQuestion q={q} answer={answer} change={change}/>:q.type==='highlight-incorrect-words'?<div className="flex flex-wrap gap-x-1 gap-y-2 text-lg leading-8">{q.text.map((word:string,i:number)=><button key={i} aria-pressed={Array.isArray(answer)&&answer.includes(i as never)} className={`rounded px-1 ${Array.isArray(answer)&&answer.includes(i as never)?'bg-amber-200':'hover:bg-slate-100'}`} onClick={()=>{const a=Array.isArray(answer)?answer as number[]:[];change(a.includes(i)?a.filter(n=>n!==i):[...a,i]);}}>{word}</button>)}</div>:<>
          {q.text&&<p className="whitespace-pre-wrap text-lg leading-9">{q.text}</p>}{q.question&&<h2 className="mb-5 mt-7 text-lg font-semibold">{q.question}</h2>}
          {(q.options||q.summaries)&&<div className="mt-5 space-y-3">{(q.options||q.summaries).map((opt:any,i:number)=>{const value=typeof opt==='string'?opt:opt.id;const multiple=q.type.includes('multiple');const selected=multiple?Array.isArray(answer)&&answer.includes(value as never):answer===value;return <label key={i} className={`flex cursor-pointer gap-4 rounded-xl border p-4 text-sm leading-6 ${selected?'border-violet-400 bg-violet-50':'border-slate-200 hover:border-violet-200'}`}><input className="mt-1 accent-violet-600" type={multiple?'checkbox':'radio'} name="choice" checked={!!selected} onChange={()=>{if(multiple){const a=Array.isArray(answer)?answer as string[]:[];change(a.includes(value)?a.filter(v=>v!==value):[...a,value]);}else change(value);}}/><span>{typeof opt==='string'?opt:opt.text}</span></label>;})}</div>}
          {['swt','write-essay','summarize-spoken-text','write-from-dictation'].includes(q.type)&&<div className="mt-7"><textarea aria-label="Your response" value={String(answer)} onPaste={e=>e.preventDefault()} spellCheck={false} onChange={e=>change(e.target.value)} className="min-h-[240px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/40 p-5 text-base leading-8 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="Write your response here…"/><div className="mt-3 flex justify-between text-xs text-slate-400"><span>{String(answer).trim()?String(answer).trim().split(/\s+/).length:0} words</span><span>{saveStatus}</span></div></div>}
        </>}
        {recording&&<div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-rose-400 transition-all" style={{width:`${level}%`}}/></div>}
      </section><aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your progress</p><p className="my-4 text-3xl font-bold">{exam.current}<span className="text-base font-normal text-slate-400"> / 66 completed</span></p><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{width:`${exam.current/66*100}%`}}/></div><p className="mt-5 text-sm leading-6 text-slate-500">Move forward when ready. Previous answers cannot be changed.</p></div><div className="rounded-2xl bg-violet-50 p-6"><Sparkles className="mb-3 h-5 w-5 text-violet-600"/><p className="text-sm font-semibold">Assessment is already underway</p><p className="mt-2 text-xs leading-6 text-slate-500">{marked} completed responses assessed in the background. Feedback appears after the full test.</p></div><button className={`${button} w-full`} disabled={busy} onClick={()=>void advance()}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<>Save & {exam.current===65?'finish':'next'}<ArrowRight className="h-4 w-4"/></>}</button><button className={`${outline} w-full`} disabled={busy} onClick={async()=>{if(!window.confirm('Leave this exam? The timers will continue. Your saved answers are kept.'))return;const recorded=await stopRecording();if(speakingTask(q.type)&&recorded?.size){const form=new FormData();form.set('attemptId',exam.id);form.set('index',String(exam.current));form.set('audio',recorded,'response.webm');await api(undefined,undefined,form);}if(!speakingTask(q.type))await api({action:'save',attemptId:exam.id,index:exam.current,answer:answerRef.current});window.location.href='/mock-tests';}}><Save className="h-4 w-4"/> Save and exit</button></aside></div>}
      {screen==='marking'&&<div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center"><Sparkles className="mx-auto mb-6 h-12 w-12 text-violet-500"/><h2 className="text-2xl font-semibold">Your answers are safely saved.</h2><p className="my-5 leading-7 text-slate-500">Most marking happens while you take the test. We’re now completing the remaining assessments and preparing your diagnostic report.</p><p className="mb-4 text-4xl font-semibold">{marked}<span className="text-lg text-slate-400"> / 66 assessed</span></p><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-violet-500 transition-all" style={{width:`${marked/66*100}%`}}/></div>{markingError&&<p role="alert" className="mt-5 text-sm text-amber-700">{markingError} Assessment will retry automatically. No extra credits are charged.</p>}<p className="mt-6 text-xs text-slate-400">You can return to this attempt later from Mock Tests.</p></div>}
      {screen==='results'&&exam&&<FullMockReport exam={exam} api={api}/>}
      {step>=0&&<footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6"><span className="text-xs text-slate-400">{step+1} of 7 · Setup does not use a credit</span><div className="flex gap-3">{step>0&&<button className={outline} disabled={recording} onClick={()=>{setError('');setScreen(STEPS[step-1]);}}>Back</button>}{screen!=='ready'&&<button className={button} disabled={!user||recording||(screen==='introduction'&&introPhase!=='done')||(screen==='headphones'&&!heard)||(screen==='microphone'&&(!deviceReady||!sample))} onClick={()=>{setError('');if(screen==='microphone'){setSample('');blob.current=null;stopping.current=null;}setScreen(STEPS[step+1]);}}>{screen==='welcome'?'Prepare for your test':'Continue'}<ArrowRight className="h-4 w-4"/></button>}</div></footer>}
      </>}
    </div>
  </main>;
}

function instructions(type:string) {
  if(type==='read-aloud')return 'Prepare for 40 seconds, then read the text aloud naturally. You have 40 seconds to record.';
  if(type==='repeat-sentence')return 'Listen to the sentence once, then repeat it exactly. Recording starts automatically after the audio.';
  if(type==='describe-image')return 'Study the image for 25 seconds. Then describe the main information in 40 seconds.';
  if(type==='retell-lecture')return 'Listen once. After 10 seconds of preparation, retell the lecture in your own words. You have 40 seconds.';
  if(type==='answer-short-question')return 'Listen once and answer with one or a few words. You have 10 seconds.';
  if(type==='summarize-group-discussion')return 'Listen to the discussion once. Prepare for 10 seconds, then summarize the speakers’ contributions and how they relate. You have 2 minutes.';
  if(type==='respond-to-situation')return 'Read and listen to the situation. Prepare for 10 seconds, then give an appropriate spoken response in 40 seconds.';
  if(type==='swt')return 'Summarize the passage in one sentence of 5–75 words. You have 10 minutes.';
  if(type==='write-essay')return 'Write an essay of 200–300 words addressing the topic. You have 20 minutes.';
  if(type==='summarize-spoken-text')return 'Listen once and write a summary of 50–70 words. You have 10 minutes, including the audio.';
  if(type==='write-from-dictation')return 'Listen once and type the sentence exactly. Check spelling before continuing.';
  if(type==='highlight-incorrect-words')return 'Listen once and select the words in the transcript that differ from the recording. Incorrect selections reduce points, to a minimum of zero.';
  if(type==='reorder-paragraphs')return 'Arrange the paragraphs in the correct order. Use the arrows to move each paragraph. Correct adjacent pairs earn points.';
  if(type.includes('multiple'))return 'Select all correct answers. Each incorrect selection cancels one correct point; the minimum for this question is zero.';
  if(type==='fill-blanks')return 'Drag a word from the bank into each blank, or select a word using the dropdown. Each correct blank earns one point.';
  if(type.includes('fill-blanks'))return 'Complete each blank with the correct word. Each correct blank earns one point.';
  return 'Select the one best answer. Continue when you are ready; you cannot return to this question.';
}
function BlankQuestion({q,answer,change}:{q:any;answer:FullAnswer;change:(v:FullAnswer)=>void}) {
  const values=Array.isArray(answer)?answer as string[]:[];
  const text=String(q.text||'').split(/\{(?:BLANK|\d+)\}/g);
  const set=(i:number,v:string)=>{const a=[...values];while(a.length<=i)a.push('');a[i]=v;change(a);};
  return <>{q.wordBank&&<div className="mb-6 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-4">{q.wordBank.map((w:string)=><span draggable onDragStart={e=>e.dataTransfer.setData('text/plain',w)} key={w} className="cursor-grab rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{w}</span>)}</div>}<div className="text-lg leading-[3.4]">{text.map((part,i)=><span key={i}>{part}{i<text.length-1&&(q.type==='listening-fill-blanks'?<input aria-label={`Blank ${i+1}`} className="mx-2 w-36 rounded-lg border border-slate-300 px-3 leading-9 focus:border-violet-500" value={values[i]||''} onChange={e=>set(i,e.target.value)} spellCheck={false}/>:<select aria-label={`Blank ${i+1}`} className="mx-2 max-w-[200px] rounded-lg border border-slate-300 bg-violet-50 px-3 py-2 text-base" value={values[i]||''} onChange={e=>set(i,e.target.value)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const w=e.dataTransfer.getData('text/plain');if(q.wordBank?.includes(w))set(i,w);}}><option value="">Select a word</option>{(q.blanks?.[i]?.options||q.wordBank||[]).map((w:string)=><option key={w} value={w}>{w}</option>)}</select>)}</span>)}</div></>;
}
function ReorderQuestion({q,answer,change}:{q:any;answer:FullAnswer;change:(v:FullAnswer)=>void}) {
  const order:string[]=Array.isArray(answer)&&answer.length?answer as string[]:q.paragraphs.map((p:any)=>p.id);
  useEffect(()=>{if(!Array.isArray(answer)||!answer.length)change(order);},[]);
  const move=(i:number,by:number)=>{const a=[...order];[a[i],a[i+by]]=[a[i+by],a[i]];change(a);};
  return <div className="space-y-3">{order.map((id,i)=><div key={id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4"><span className="text-sm font-bold text-violet-400">{i+1}</span><p className="flex-1 text-base leading-7">{q.paragraphs.find((p:any)=>p.id===id)?.text}</p><div><button aria-label="Move paragraph up" disabled={i===0} className="block p-1 disabled:opacity-20" onClick={()=>move(i,-1)}><ChevronUp className="h-5 w-5"/></button><button aria-label="Move paragraph down" disabled={i===order.length-1} className="block p-1 disabled:opacity-20" onClick={()=>move(i,1)}><ChevronDown className="h-5 w-5"/></button></div></div>)}</div>;
}
