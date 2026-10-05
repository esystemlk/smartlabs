'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { ArrowLeft, CheckCircle2, Clock3, Flag } from 'lucide-react';
import data from '@/lib/ielts-reading/cambridge-11-test-1.json';
import './reading-test.css';

type Answers = Record<string, string>;
type Review = { score: number; total: number; results: { id: number; answer: string; accepted: string[]; correct: boolean }[] };
const groups: Record<number, { title: string; instructions: string }> = {
  1: { title: 'Questions 1–7 · Indoor farming', instructions: 'Complete the sentences. Choose NO MORE THAN TWO WORDS from the passage for each answer.' },
  8: { title: 'Questions 8–13', instructions: 'Choose TRUE if the statement agrees with the information, FALSE if it contradicts the information, or NOT GIVEN if there is no information on this.' },
  14: { title: 'Questions 14–19', instructions: 'Choose TRUE if the statement agrees with the information, FALSE if it contradicts the information, or NOT GIVEN if there is no information on this.' },
  20: { title: 'Questions 20–26 · Diagram labelling', instructions: 'Label the diagram. Choose ONE WORD from the passage for each answer.' },
  27: { title: 'Questions 27–29', instructions: 'Which paragraph contains the following information? Choose the correct letter, A–H.' },
  30: { title: 'Questions 30–36 · Geo-engineering projects', instructions: 'Complete the table below. Choose ONE WORD from the passage for each answer.' },
  37: { title: 'Questions 37–40', instructions: 'Match each statement with the correct scientist, A–D. A: Roger Angel · B: Phil Rasch · C: Dan Lunt · D: Martin Sommerkorn.' },
};

export function ReadingTest() {
  const { user } = useUser();
  const storageKey = `ielts-reading:${user?.uid ?? 'guest'}:${data.id}:v${data.version}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [passage, setPassage] = useState(0);
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

  useEffect(() => {
    // Restore a browser draft after hydration, scoped to the signed-in account.
    const restore = window.setTimeout(() => {
      setAnswers({}); setFlags([]); setSeconds(0); setPassage(0); setReview(null); setRunning(false);
      let restoredSeconds = 0;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
          if (saved.answers && typeof saved.answers === 'object') setAnswers(Object.fromEntries(Object.entries(saved.answers).filter(([key, value]) => /^([1-9]|[1-3][0-9]|40)$/.test(key) && typeof value === 'string' && value.length <= 200)) as Answers);
          if (Array.isArray(saved.flags)) setFlags(saved.flags.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 40));
          if (Number.isFinite(saved.seconds)) { restoredSeconds = Math.max(0, saved.seconds); setSeconds(restoredSeconds); }
          if ([0, 1, 2].includes(saved.passage)) setPassage(saved.passage);
        }
      } catch { setSaveStatus('Device storage is unavailable. Keep this page open to retain your answers.'); }
      // Start the timer automatically as soon as the test loads.
      elapsedBase.current = restoredSeconds; started.current = Date.now(); setRunning(true);
      setLoaded(storageKey);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [storageKey]);

  useEffect(() => {
    if (loaded !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, flags, seconds, passage }));
    } catch { return; }
  }, [answers, flags, seconds, passage, loaded, storageKey]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(elapsedBase.current + Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const available = data.questions.filter(q => q.kind !== 'unavailable');
  const answered = available.filter(q => answers[q.id]?.trim()).length;
  function toggleTimer() {
    if (running) setRunning(false);
    else { elapsedBase.current = seconds; started.current = Date.now(); setRunning(true); }
  }
  function input(id: number) {
    const q = data.questions.find(q => q.id === id)!;
    const result = review?.results.find(r => r.id === id);
    return <div className="reading-answer">
      <label className="sr-only" htmlFor={`answer-${id}`}>Answer {id}</label>
      {q.kind === 'choice' ? <select id={`answer-${id}`} value={answers[id] || ''} disabled={!!review || busy} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))}><option value="">Choose an answer</option>{q.options.map(o => <option key={o} value={o}>{o}</option>)}</select> : <input id={`answer-${id}`} autoComplete="off" spellCheck={false} maxLength={200} value={answers[id] || ''} disabled={!!review || busy} placeholder={`${q.wordLimit} word${q.wordLimit === 1 ? '' : 's'} maximum`} onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))} />}
      {result && <p className={result.correct ? 'reading-correct' : 'reading-incorrect'}>{result.correct ? 'Correct' : `Accepted: ${result.accepted.join(' / ')}`} · Your answer: {result.answer || 'Unanswered'}</p>}
    </div>;
  }
  function tableCell(text: string) {
    return text.split(/(\{\d+\})/).map((piece, i) => /^\{\d+\}$/.test(piece) ? <div className="reading-table-answer" key={i} id={`question-${piece.slice(1,-1)}`}><strong>{piece.slice(1,-1)}</strong>{input(Number(piece.slice(1,-1)))}</div> : <span key={i}>{piece}</span>);
  }
  async function submit() {
    setBusy(true); setError(''); setRunning(false);
    try {
      const response = await fetch('/api/ielts-reading/cambridge-11-test-1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not mark your answers.');
      setReview(result); setConfirm(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again. Your answers are still here.'); }
    finally { setBusy(false); }
  }
  function navigateQuestion(id: number) {
    const q = data.questions.find(item => item.id === id)!;
    setPassage(q.passage);
    window.setTimeout(() => document.getElementById(`question-${id}`)?.scrollIntoView({ behavior: 'auto', block: 'center' }), 0);
  }

  return <div className="reading-test">
    <Link href="/dashboard/ielts/reading" className="reading-back"><ArrowLeft size={16} /> Reading collection</Link>
    <header className="reading-title"><p className="studio-eyebrow">ACADEMIC READING · GUIDED PRACTICE</p><h1>{data.title}</h1><p>Three passages · 40 questions · answers saved on this device</p></header>
    <div className="reading-toolbar"><span><CheckCircle2 size={17} /> {answered} / 40 answered</span><span><Clock3 size={17} /> {Math.floor(seconds / 60).toString().padStart(2,'0')}:{(seconds % 60).toString().padStart(2,'0')} elapsed</span><button disabled={!!review} onClick={toggleTimer}>{running ? 'Pause timer' : 'Start timer'}</button><span>{saveStatus || 'Answers saved on this device'}</span></div>
    {review && <section className="reading-results" role="status"><h2>{review.score} / {review.total} correct</h2><p>Marked against the answer key in your supplied PDF. This is a practice raw score, not an official IELTS band score.</p><button onClick={() => { setReview(null); setConfirm(false); }}>Edit answers and try again</button></section>}
    <nav className="reading-tabs" aria-label="Reading passages">{data.passages.map((p,i) => <button key={p.title} aria-pressed={passage === i} onClick={() => setPassage(i)}>Passage {i+1}<small>{p.title}</small></button>)}</nav>
    <div className="reading-workspace"><article className="reading-passage" key={passage}><p className="studio-eyebrow">READING PASSAGE {passage+1}</p><h2>{data.passages[passage].title}</h2>{passage === 1 && <p><em>A unique engineering achievement</em></p>}{passage === 2 && <p><em>Mark Rowe reports on the increasingly ambitious geo-engineering projects being explored by scientists</em></p>}{data.passages[passage].paragraphs.map((paragraph,i) => <p key={i}>{paragraph}</p>)}</article>
      <section className="reading-questions" aria-label="Questions">{data.questions.filter(q => q.passage === passage).map(q => {
        if (q.id > 30 && q.id <= 36) return null;
        return <div key={q.id}>
          {groups[q.id] && <header className="reading-group"><h3>{groups[q.id].title}</h3><p>{groups[q.id].instructions}</p></header>}
          {q.id === 20 ? <div className="reading-diagram"><a href="/images/ielts/reading/falkirk-wheel.png" target="_blank" rel="noreferrer"><Image src="/images/ielts/reading/falkirk-wheel.png" alt="Falkirk Wheel boat lift diagram with blanks 20 to 26; label text is provided below." width={1000} height={677} /><span>Open full-size diagram</span></a><div id="question-20"><label htmlFor="answer-20"><b>20</b> {q.prompt}</label>{input(20)}</div></div> : q.id === 30 ? <table className="reading-table"><caption>Geo-engineering projects</caption><thead><tr><th>Procedure</th><th>Aim</th></tr></thead><tbody>{data.table.map((row,i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{tableCell(cell)}</td>)}</tr>)}</tbody></table> : <div className="reading-question" id={`question-${q.id}`}><div className="reading-question-label"><label htmlFor={`answer-${q.id}`}><b>{q.id}</b> {q.prompt}</label><button title={`Flag question ${q.id} for review`} aria-label={`Flag question ${q.id} for review`} aria-pressed={flags.includes(q.id)} onClick={() => setFlags(f => f.includes(q.id) ? f.filter(n => n !== q.id) : [...f,q.id])}><Flag size={16} /></button></div>{input(q.id)}</div>}
        </div>;
      })}</section></div>
    <nav className="reading-question-nav" aria-label="Question navigation">{data.questions.map(q => <button key={q.id} disabled={q.kind === 'unavailable'} title={`Question ${q.id}${q.kind === 'unavailable' ? ' — diagram missing' : ''}`} aria-label={`Question ${q.id}${flags.includes(q.id) ? ', flagged' : ''}`} className={`${answers[q.id]?.trim() ? 'is-answered' : ''} ${flags.includes(q.id) ? 'is-flagged' : ''}`} onClick={() => navigateQuestion(q.id)}>{q.id}</button>)}</nav>
    <div className="reading-submit">{!review && !confirm && <button className="studio-primary" onClick={() => setConfirm(true)}>Review and submit answers</button>}{confirm && !review && <section aria-label="Confirm submission"><p>{answered} answered · {40-answered} unanswered. Submit all 40 questions for marking?</p><button className="studio-primary" disabled={busy} onClick={submit}>{busy ? 'Marking…' : 'Submit for marking'}</button><button disabled={busy} onClick={() => setConfirm(false)}>Keep practising</button></section>}{error && <p role="alert">{error}</p>}</div>
    <p className="reading-source">Content and answer key transcribed from the supplied PDF. Cambridge IELTS 11 Academic Reading Test 1. Diagram supplied separately by the owner.</p>
  </div>;
}
