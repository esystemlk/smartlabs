import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { getMockCredits } from '@/lib/mock-credits';
import { FREE_MOCK_LIMIT } from '@/lib/mock-packages';
import { FULL_BANK } from '@/lib/full-mock-bank';
import { FULL_MOCK_ID, FULL_TASKS, PARTS, aggregateFullScores, speakingTask, type FullAttempt, type FullAnswer } from '@/lib/full-mock';
import { scoreFullQuestion } from '@/lib/full-mock-scoring';
import { hasMockAiKey } from '@/lib/mock-ai-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const BUCKET = 'smart-labs-ekk8j.firebasestorage.app';
const attempts = () => adminDb!.collection('pte_full_mock_attempts');
const records = (id: string) => attempts().doc(id).collection('responses');
const aiReady = hasMockAiKey;
class ExamError extends Error { constructor(message: string, public status = 400) { super(message); } }
const empty = (a: FullAnswer) => Array.isArray(a) ? !a.length : !a.trim();

function startClock(a: FullAttempt, now: number) {
  const q = a.questions[a.current];
  if (!q) { a.status = 'submitted'; return; }
  const spec = FULL_TASKS.find(t => t.type === q.type)!;
  a.questionStartedAt = now;
  // Audio has a server-side allowance; response timing starts separately on the play action.
  a.questionEndsAt = spec.respond ? Math.min(a.partEndsAt, now + (spec.prepare+spec.respond+(speakingTask(q.type) && q.type !== 'read-aloud' && q.type !== 'describe-image' ? 210 : 0))*1000) : a.partEndsAt;
}
function next(a: FullAttempt, now: number, index = a.current+1) {
  const oldPart = a.questions[a.current]?.part;
  a.current = index;
  if (a.questions[index] && a.questions[index].part !== oldPart) a.partEndsAt = now + PARTS[a.questions[index].part].seconds*1000;
  startClock(a,now);
}
function sync(a: FullAttempt, now: number) {
  if (a.status !== 'in_progress') return;
  if (now >= a.expiresAt) { a.current = a.questions.length; a.status = 'submitted'; return; }
  if (now > a.partEndsAt) {
    const part = a.questions[a.current]?.part;
    const nextPart = a.questions.findIndex(q => q.part > (part ?? 2));
    next(a,now,nextPart < 0 ? a.questions.length : nextPart);
  } else if (now > a.questionEndsAt+15000) next(a,now);
}
async function owned(id: string, uid: string, role: string, allowStaff = false) {
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) throw new ExamError('Invalid attempt ID.');
  const snap = await attempts().doc(id).get();
  if (!snap.exists) throw new ExamError('Attempt not found.',404);
  const a = snap.data() as FullAttempt;
  if (a.userId !== uid && !(allowStaff && ['admin','developer','teacher'].includes(role))) throw new ExamError('This attempt belongs to another student.',403);
  return a;
}
function studentQuestion(source: Record<string, any>, type: string) {
  const d = source.data;
  const result: Record<string, any> = { audioUrl: source.audioUrl || '', imageUrl: source.imageUrl || '' };
  // Explicit allowlist: answer keys and listening reference transcripts never reach an active exam.
  if (type === 'read-aloud') result.text = d.text;
  if (type === 'respond-to-situation') result.text = d.situation;
  if (type === 'write-essay') result.text = d.topic ?? d.text;
  if (d.passage) result.text = d.passage;
  if (type === 'listening-fill-blanks' || type === 'highlight-incorrect-words') result.text = d.transcript;
  if (d.question && !speakingTask(type)) result.question = d.question;
  if (d.options) result.options = d.options;
  if (d.summaries) result.summaries = d.summaries;
  if (d.blanks) result.blanks = d.blanks.map((b: any) => ({ id: b.id, options: b.options }));
  if (type === 'fill-blanks') result.wordBank = [...d.correctWords,...d.extraWords].sort();
  if (type === 'reorder-paragraphs') result.paragraphs = d.paragraphs.map((text: string,i: number) => ({ id:d.paragraphIds[i],text })).sort((a: any,b: any)=>a.id.localeCompare(b.id));
  return result;
}
async function state(id: string, canReview: boolean) {
  const ref = attempts().doc(id);
  const a = await adminDb!.runTransaction(async tx => {
    const snap = await tx.get(ref); const a = snap.data() as FullAttempt;
    const before = JSON.stringify(a); sync(a,Date.now());
    if (before !== JSON.stringify(a)) tx.set(ref,a);
    return a;
  });
  const assessed = new Set(a.scoredIndices || []);
  const pending = a.questions.map((_,i) => i).filter(i => i < a.current && !assessed.has(i));
  const current = a.questions[a.current];
  const r = current ? (await records(id).doc(String(a.current)).get()).data() : undefined;
  let review;
  if (a.status === 'scored' && canReview) {
    const responseSnap = await records(id).get();
    const map = new Map(responseSnap.docs.map(d => [Number(d.id),d.data()]));
    const bucket = admin.storage().bucket(BUCKET);
    review = await Promise.all(a.questions.map(async (q,i) => {
      const row = map.get(i) || {};
      const audioUrl = row.audioPath ? (await bucket.file(row.audioPath).getSignedUrl({ action:'read', expires: Date.now()+60*60*1000 }))[0] : '';
      return { ...q, index:i, answer: row.answer ?? '', audioUrl, score: row.score, source: row.source?.data || {}, imageUrl: row.source?.imageUrl || '', referenceAudioUrl: row.source?.audioUrl || '', lecturerNote: row.lecturerNote || '' };
    }));
  }
  return { id, status:a.status, current:a.current, total:a.questions.length, serverNow:Date.now(),
    partEndsAt:a.partEndsAt, questionStartedAt:a.questionStartedAt, questionEndsAt:a.questionEndsAt,
    pending, scored:a.current-pending.length, results:a.results || null,
    question: current && r ? { ...current, ...studentQuestion(r.source,current.type), answer:r.answer ?? '', played:!!r.played, audioPath: r.audioPath || '', responseStartsAt: r.responseStartsAt || 0 } : null,
    ...(review ? { review } : {}),
  };
}
export async function GET(req: Request) {
  try {
    const auth = await verifyAuthed(req);
    if (!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
    const id = new URL(req.url).searchParams.get('attemptId');
    if (id) { await owned(id,auth.uid,auth.role,true); return NextResponse.json({...await state(id,true),canAnnotate:['admin','developer','teacher'].includes(auth.role)}); }
    if (new URL(req.url).searchParams.get('review') === '1') {
      if (!['admin','developer','teacher'].includes(auth.role)) throw new ExamError('Lecturer access required.',403);
      const list = await attempts().orderBy('createdAt','desc').limit(100).get();
      const users = [...new Set(list.docs.map(d=>d.data().userId as string))];
      const profiles = users.length ? await adminDb!.getAll(...users.map(uid=>adminDb!.collection('users').doc(uid))) : [];
      const names = new Map(profiles.map(p=>[p.id,p.data()?.displayName || p.data()?.email || p.id]));
      return NextResponse.json({attempts:list.docs.map(d=>({id:d.id,userId:d.data().userId,student:names.get(d.data().userId),status:d.data().status,createdAt:d.data().createdAt,results:d.data().results || null}))});
    }
    const [credits, slot, history] = await Promise.all([
      getMockCredits(auth.uid), adminDb!.collection('pte_full_mock_sessions').doc(auth.uid).get(),
      attempts().where('userId','==',auth.uid).get(),
    ]);
    return NextResponse.json({ credits, aiReady:aiReady(), attemptId:slot.data()?.attemptId || null, tasks:FULL_TASKS, parts:PARTS,
      history: history.docs.map(d => ({ id:d.id, status:d.data().status, createdAt:d.data().createdAt, results:d.data().results || null })).sort((a,b)=>b.createdAt-a.createdAt).slice(0,20) });
  } catch(e) { return failure(e); }
}
function failure(e: unknown) {
  if (!(e instanceof ExamError)) console.error('[full-mock]',e instanceof Error ? e.message : 'Unexpected error');
  return NextResponse.json({ error:e instanceof ExamError ? e.message : 'The exam service is unavailable. Your saved progress is safe.' },{status:e instanceof ExamError ? e.status : 503});
}
export async function POST(req: Request) {
  try {
    const auth = await verifyAuthed(req);
    if (!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
    const { uid,role } = auth;
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await req.formData();
      const id = String(form.get('attemptId') || ''); const index = Number(form.get('index'));
      const a = await owned(id,uid,role);
      const file = form.get('audio');
      if (!(file instanceof File) || !file.size || file.size > 8*1024*1024 || !/^audio\/(webm|ogg|mp4|mpeg|wav)/.test(file.type)) throw new ExamError('A valid audio recording up to 8 MB is required.');
      if (a.status !== 'in_progress' || a.current !== index || !speakingTask(a.questions[index]?.type) || Date.now() > a.questionEndsAt+15000) throw new ExamError('This recording window has closed.',409);
      const audioPath = `full-mock-responses/${uid}/${id}/${index}-${randomUUID()}`;
      await admin.storage().bucket(BUCKET).file(audioPath).save(Buffer.from(await file.arrayBuffer()),{metadata:{contentType:file.type}});
      await adminDb!.runTransaction(async tx => {
        const snap = await tx.get(attempts().doc(id)); const latest = snap.data() as FullAttempt;
        if (latest.current !== index || latest.status !== 'in_progress') throw new ExamError('Question already completed.',409);
        tx.update(records(id).doc(String(index)),{audioPath});
      });
      return NextResponse.json({audioPath});
    }
    const body = await req.json();
    if (body.action === 'start') {
      // Validate all source documents BEFORE any debit. No guessed media URLs or partial exams.
      const docs = await adminDb!.getAll(...FULL_BANK.map(q => adminDb!.collection('pte_questions').doc(q.id)));
      const problems = docs.filter((d,i) => !d.exists || d.data()?.taskType !== FULL_BANK[i].type || !d.data()?.data || ('localPath' in FULL_BANK[i].item && !d.data()?.audioUrl && !d.data()?.imageUrl));
      if (FULL_BANK.length !== 66 || problems.length) throw new ExamError('Mock 1 is not ready: some question documents or media are missing. Please contact Smart Labs.',409);
      const newRef = attempts().doc();
      const session = adminDb!.collection('pte_full_mock_sessions').doc(uid);
      const userRef = adminDb!.collection('users').doc(uid);
      const id = await adminDb!.runTransaction(async tx => {
        const [slot,user] = await Promise.all([tx.get(session),tx.get(userRef)]);
        const existingId = slot.data()?.attemptId;
        if (existingId) {
          const existing = await tx.get(attempts().doc(existingId));
          if (existing.exists && existing.data()?.status !== 'scored') return existingId as string;
        }
        if (!aiReady()) throw new ExamError('AI marking is temporarily unavailable. No mock credit has been used. Please contact Smart Labs.',503);
        const d = user.data() || {};
        const unlimited = ['admin','developer','teacher'].includes(d.role) || (d.mockMonthlyExpiry?.toMillis?.() || 0)>Date.now() || (d.bundleExpiry?.toMillis?.() || 0)>Date.now();
        if (!unlimited) {
          if ((d.mockPaidCredits || 0)>0) tx.update(userRef,{mockPaidCredits:d.mockPaidCredits-1});
          else if ((d.mockFreeUsed || 0)<FREE_MOCK_LIMIT) tx.update(userRef,{mockFreeUsed:(d.mockFreeUsed || 0)+1});
          else throw new ExamError('You need one mock credit to start this exam. AI practice credits cannot be used.',402);
        }
        const now = Date.now();
        const a: FullAttempt = { userId:uid, status:'in_progress', createdAt:now, current:0,
          questions:FULL_BANK.map(q => ({id:q.id,type:q.type,part:FULL_TASKS.find(t=>t.type===q.type)!.part})),
          partEndsAt:now+PARTS[0].seconds*1000,questionStartedAt:now,questionEndsAt:0,expiresAt:now+4*60*60*1000 };
        startClock(a,now);
        tx.set(newRef,{...a,mockId:FULL_MOCK_ID,weightVersion:'pearson-average-v1-half-percent',creditCharged:!unlimited});
        docs.forEach((doc,i) => {
          const source=doc.data()!;
          if (FULL_BANK[i].type==='reorder-paragraphs') source.data={...source.data,paragraphIds:source.data.paragraphs.map(()=>randomUUID())};
          tx.set(newRef.collection('responses').doc(String(i)),{source,answer:'',played:false});
        });
        tx.set(session,{attemptId:newRef.id});
        return newRef.id;
      });
      return NextResponse.json(await state(id,false));
    }
    const id = String(body.attemptId || '');
    const a = await owned(id,uid,role,body.action === 'note');
    if (body.action === 'note') {
      if (!['admin','developer','teacher'].includes(role) || a.status !== 'scored') throw new ExamError('Lecturer access is required.',403);
      if (!Number.isInteger(body.index) || body.index<0 || body.index>=a.questions.length || typeof body.note !== 'string' || body.note.length>5000) throw new ExamError('Invalid review note.');
      await records(id).doc(String(body.index)).update({lecturerNote:body.note,reviewedBy:uid,reviewedAt:Date.now()});
      return NextResponse.json({ok:true});
    }
    if (body.action === 'score') {
      const index = body.index;
      if (!Number.isInteger(index) || index<0 || index>=a.current) throw new ExamError('Only completed questions can be scored.');
      const ref = records(id).doc(String(index)); const lease = randomUUID();
      const claim = await adminDb!.runTransaction(async tx => {
        const [row,lock] = await Promise.all([tx.get(ref),tx.get(attempts().doc(id).collection('locks').doc('scoring'))]);
        const r = row.data()!;
        if (r.score) return null;
        if ((lock.data()?.until || 0)>Date.now()) return null;
        tx.set(attempts().doc(id).collection('locks').doc('scoring'),{lease,until:Date.now()+300000});
        return r;
      });
      if (claim) {
        try {
          const score = await scoreFullQuestion(a.questions[index].type,claim.source,claim.answer ?? '',claim.audioPath,req.headers.get('Authorization')!);
          await adminDb!.runTransaction(async tx => {
            const attemptRef=attempts().doc(id);
            const latest=await tx.get(attemptRef);
            const scoredIndices=[...new Set([...(latest.data()?.scoredIndices || []),index])];
            tx.update(ref,{score,scoredAt:Date.now()});
            tx.update(attemptRef,{scoredIndices});
          });
        } finally {
          await adminDb!.runTransaction(async tx => {
            const lockRef = attempts().doc(id).collection('locks').doc('scoring');
            const lock = await tx.get(lockRef);
            if (lock.data()?.lease === lease) tx.delete(lockRef);
          });
        }
      }
      return NextResponse.json({ok:true});
    }
    if (body.action === 'finish') {
      const current = await state(id,false);
      if (current.status === 'in_progress') throw new ExamError('Complete the exam before requesting results.',409);
      if (current.pending.length) return NextResponse.json({...current,ready:false});
      const rows = await records(id).get();
      const results = aggregateFullScores(a.questions.map((q,i) => ({type:q.type,score:rows.docs.find(d=>d.id===String(i))!.data().score})));
      await attempts().doc(id).update({results,status:'scored',scoredAt:Date.now()});
      return NextResponse.json({...await state(id,true),ready:true,canAnnotate:['admin','developer','teacher'].includes(role)});
    }
    if (!['save','play','respond'].includes(body.action)) throw new ExamError('Unknown exam action.');
    const index = body.index;
    if (!Number.isInteger(index) || index<0 || index>=a.questions.length) throw new ExamError('Invalid question index.');
    if (body.action === 'save' && !(typeof body.answer === 'string' && body.answer.length<20000 || Array.isArray(body.answer) && body.answer.length<250 && body.answer.every((v: unknown) => typeof v === 'string' && v.length<2000 || typeof v === 'number' && Number.isInteger(v)))) throw new ExamError('Invalid answer.');
    await adminDb!.runTransaction(async tx => {
      const ref = attempts().doc(id); const rowRef = records(id).doc(String(index));
      const [snap,row] = await Promise.all([tx.get(ref),tx.get(rowRef)]);
      const latest = snap.data() as FullAttempt; const now = Date.now();
      if (latest.status !== 'in_progress' || latest.current !== index) return; // repeat saves are idempotent
      if (now > latest.expiresAt || now > latest.partEndsAt+5000 || now > latest.questionEndsAt+15000) {
        sync(latest,now);tx.set(ref,latest,{merge:true});return;
      }
      if (body.action === 'respond') {
        if (!row.data()?.source?.audioUrl || !row.data()?.played) throw new ExamError('Reference playback is required before recording.',409);
        if (!row.data()?.responseStartsAt && speakingTask(latest.questions[index].type)) {
          const spec = FULL_TASKS.find(t=>t.type===latest.questions[index].type)!;
          const startsAt = now+spec.prepare*1000;
          tx.update(rowRef,{responseStartsAt:startsAt});
          latest.questionEndsAt = Math.min(latest.partEndsAt,startsAt+spec.respond*1000);
        }
      } else if (body.action === 'play') {
        if (!row.data()?.source?.audioUrl || row.data()?.played) return;
        tx.update(rowRef,{played:true});
      } else {
        if (now <= Math.min(latest.partEndsAt+5000,latest.questionEndsAt+15000)) tx.update(rowRef,{answer:body.answer,savedAt:now});
        if (body.advance) next(latest,now);
      }
      sync(latest,now);
      tx.set(ref,latest,{merge:true});
    });
    return NextResponse.json(await state(id,false));
  } catch(e) { return failure(e); }
}
