'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { ArrowLeft, CheckCircle2, Clock3, Flag, Headphones } from 'lucide-react';
import './reading-test.css';
import './reading-runner.css';
import './listening-runner.css';

type Choice = { letter: string; text: string };
type Question = { id: number; part: number; kind: 'text' | 'choice' | 'unavailable'; prompt?: string; options?: string[]; choices?: Choice[]; wordLimit?: number };
type Section = { part: number; title: string; subtitle?: string; audio: string };
type Block =
  | { type: 'map'; startId: number; endId: number; image: string; alt: string; caption?: string }
  | { type: 'summary'; startId: number; endId: number; title?: string; text: string };
type TestData = {
  id: string; title: string; version: number; endpoint: string;
  sections: Section[]; groups: Record<string, { title: string; instructions: string }>;
  blocks?: Block[]; questions: Question[];
};
type Answers = Record<string, string>;
type Review = { score: number; total: number; results: { id: number; answer: string; accepted: string[]; correct: boolean }[] };

export function ListeningRunner({ data }: { data: TestData }) {
  const { user } = useUser();
  const storageKey = `ielts-listening:${user?.uid ?? 'guest'}:${data.id}:v${data.version}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [part, setPart] = useState(1);
  const [flags, setFlags] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [loaded, setLoaded] = useState('');
  const started = useRef(0);
  const elapsedBase = useRef(0);

  const total = data.questions.filter(q => q.kind !== 'unavailable').length;
  const parts = data.sections.map(s => s.part);
  const blockByStart = useMemo(() => { const m: Record<number, Block> = {}; (data.blocks ?? []).forEach(b => { m[b.startId] = b; }); return m; }, [data.blocks]);
  const blockIds = useMemo(() => { const s = new Set<number>(); (data.blocks ?? []).forEach(b => { for (let i = b.startId; i <= b.endId; i++) s.add(i); }); return s; }, [data.blocks]);
  const section = data.sections.find(s => s.part === part) ?? data.sections[0];

  useEffect(() => {
    const restore = window.setTimeout(() => {
      setAnswers({}); setFlags([]); setSeconds(0); setPart(1); setReview(null); setRunning(false);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
          if (saved.answers && typeof saved.answers === 'object') setAnswers(Object.fromEntries(Object.entries(saved.answers).filter(([key, value]) => /^([1-9]|[1-3][0-9]|40)$/.test(key) && typeof value === 'string' && value.length <= 200)) as Answers);
          if (Array.isArray(saved.flags)) setFlags(saved.flags.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 40));
          if (Number.isFinite(saved.seconds)) setSeconds(Math.max(0, saved.seconds));
          if ([1, 2, 3, 4].includes(saved.part)) setPart(saved.part);
        }
      } catch { setSaveStatus('Device storage is unavailable. Keep this page open to retain your answers.'); }
      setLoaded(storageKey);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [storageKey]);

  useEffect(() => {
    if (loaded !== storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ answers, flags, seconds, part })); } catch { return; }
  }, [answers, flags, seconds, part, loaded, storageKey]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(elapsedBase.current + Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const answered = data.questions.filter(q => q.kind !== 'unavailable' && answers[q.id]?.trim()).length;
  function toggleTimer() {
    if (running) setRunning(false);
    else { elapsedBase.current = seconds; started.current = Date.now(); setRunning(true); }
  }

  function input(id: number) {
    const q = data.questions.find(q => q.id === id)!;
    const result = review?.results.find(r => r.id === id);
    return <div className="reading-answer">
      <label className="sr-only" htmlFor={`answer-${id}`}>Answer {id}</label>
      {q.kind === 'choice'
        ? <select id={`answer-${id}`} value={answers[id] || ''} disabled={!!review || busy} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))}><option value="">Choose</option>{q.options!.map(o => <option key={o} value={o}>{o}</option>)}</select>
        : <input id={`answer-${id}`} autoComplete="off" spellCheck={false} maxLength={200} value={answers[id] || ''} disabled={!!review || busy} placeholder={`${q.wordLimit} word${q.wordLimit === 1 ? '' : 's'} max`} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))} />}
      {result && <p className={result.correct ? 'reading-correct' : 'reading-incorrect'}>{result.correct ? 'Correct' : `Accepted: ${result.accepted.join(' / ')}`} · Your answer: {result.answer || 'Unanswered'}</p>}
    </div>;
  }

  function normalQuestion(q: Question) {
    return <div className="reading-question" id={`question-${q.id}`} key={q.id}>
      <div className="reading-question-label">
        <label htmlFor={`answer-${q.id}`}><b>{q.id}</b> {q.prompt}</label>
        <button title={`Flag question ${q.id} for review`} aria-label={`Flag question ${q.id} for review`} aria-pressed={flags.includes(q.id)} onClick={() => setFlags(f => f.includes(q.id) ? f.filter(n => n !== q.id) : [...f, q.id])}><Flag size={16} /></button>
      </div>
      {q.choices && <ul className="reading-choices">{q.choices.map(c => <li key={c.letter}><b>{c.letter}</b> {c.text}</li>)}</ul>}
      {input(q.id)}
    </div>;
  }

  function mapBlock(block: Extract<Block, { type: 'map' }>) {
    const ids: number[] = []; for (let i = block.startId; i <= block.endId; i++) ids.push(i);
    return <div className="reading-diagram" key={`map-${block.startId}`}>
      <a href={block.image} target="_blank" rel="noreferrer"><Image src={block.image} alt={block.alt} width={900} height={1024} /><span>Open full-size map</span></a>
      {block.caption && <p className="reading-diagram-caption">{block.caption}</p>}
      <div className="reading-diagram-labels">{ids.map(id => { const q = data.questions.find(x => x.id === id)!; return <div className="reading-diagram-label" id={`question-${id}`} key={id}><label htmlFor={`answer-${id}`}><b>{id}</b> {q.prompt}</label>{input(id)}</div>; })}</div>
    </div>;
  }

  async function submit() {
    setBusy(true); setError(''); setRunning(false);
    try {
      const response = await fetch(data.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not mark your answers.');
      setReview(result); setConfirm(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again. Your answers are still here.'); }
    finally { setBusy(false); }
  }

  function navigateQuestion(id: number) {
    const q = data.questions.find(item => item.id === id)!;
    setPart(q.part);
    window.setTimeout(() => document.getElementById(`question-${id}`)?.scrollIntoView({ behavior: 'auto', block: 'center' }), 0);
  }

  return <div className="reading-test listening-test">
    <Link href="/dashboard/ielts/listening" className="reading-back"><ArrowLeft size={16} /> Listening collection</Link>
    <header className="reading-title"><p className="studio-eyebrow">ACADEMIC LISTENING · GUIDED PRACTICE</p><h1>{data.title}</h1><p>Four parts · {total} questions · answers saved on this device</p></header>
    <div className="reading-toolbar"><span><CheckCircle2 size={17} /> {answered} / {total} answered</span><span><Clock3 size={17} /> {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')} elapsed</span><button disabled={!!review} onClick={toggleTimer}>{running ? 'Pause timer' : 'Start timer'}</button><span>{saveStatus || 'Answers saved on this device'}</span></div>
    {review && <section className="reading-results" role="status"><h2>{review.score} / {review.total} correct</h2><p>Marked against the supplied answer key. This is a practice raw score, not an official IELTS band score.</p><button onClick={() => { setReview(null); setConfirm(false); }}>Edit answers and try again</button></section>}
    <nav className="reading-tabs" aria-label="Listening parts">{data.sections.map(s => <button key={s.part} aria-pressed={part === s.part} onClick={() => setPart(s.part)}>Part {s.part}<small>{s.subtitle}</small></button>)}</nav>

    <div className="listening-player">
      <div className="listening-player-head"><Headphones size={18} /><span>Part {section.part} audio{section.subtitle ? ` · ${section.subtitle}` : ''}</span></div>
      <audio key={section.part} controls preload="none" src={section.audio} className="listening-audio">Your browser does not support audio playback.</audio>
      <p className="listening-player-note">In the real test each recording is played once. For practice you may replay it. If the audio does not load yet, it is being prepared.</p>
    </div>

    <section className="reading-questions listening-questions" aria-label="Questions">{data.questions.filter(q => q.part === part).map(q => {
      if (blockIds.has(q.id) && !blockByStart[q.id]) return null;
      const header = data.groups[q.id] ? <header className="reading-group" key={`g-${q.id}`}><h3>{data.groups[q.id].title}</h3><p>{data.groups[q.id].instructions}</p></header> : null;
      const block = blockByStart[q.id];
      const body = block && block.type === 'map' ? mapBlock(block) : normalQuestion(q);
      return <div key={q.id}>{header}{body}</div>;
    })}</section>

    <nav className="reading-question-nav" aria-label="Question navigation">{data.questions.map(q => <button key={q.id} disabled={q.kind === 'unavailable'} title={`Question ${q.id}`} aria-label={`Question ${q.id}${flags.includes(q.id) ? ', flagged' : ''}`} className={`${answers[q.id]?.trim() ? 'is-answered' : ''} ${flags.includes(q.id) ? 'is-flagged' : ''}`} onClick={() => navigateQuestion(q.id)}>{q.id}</button>)}</nav>
    <div className="reading-submit">{!review && !confirm && <button className="studio-primary" onClick={() => setConfirm(true)}>Review and submit answers</button>}{confirm && !review && <section aria-label="Confirm submission"><p>{answered} answered · {total - answered} unanswered. Submit all {total} questions for marking?</p><button className="studio-primary" disabled={busy} onClick={submit}>{busy ? 'Marking…' : 'Submit for marking'}</button><button disabled={busy} onClick={() => setConfirm(false)}>Keep practising</button></section>}{error && <p role="alert">{error}</p>}</div>
    <p className="reading-source">Audio and answer key supplied by the owner. {data.title}.</p>
  </div>;
}

export type { TestData as ListeningTestData };
