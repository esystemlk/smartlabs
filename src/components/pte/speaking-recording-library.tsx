'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { speakingRequest } from '@/lib/services/speaking-recordings.client';
import { SPEAKING_TASKS, type SpeakingRecording } from '@/lib/speaking-recordings';
import type { SpeakingScore } from '@/ai/flows/score-pte-speaking';

function RecordingCard({ answer, onDelete }: { answer: SpeakingRecording; onDelete: () => void }) {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const urlRef = useRef('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState(answer.score);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, []);
  const run = async (action: 'play' | 'score' | 'delete') => {
    if (!user || busy) return;
    setBusy(action); setError('');
    try {
      if (action === 'play') {
        const response = await speakingRequest(user, `/${answer.id}`);
        const blob = await response.blob();
        if (!mounted.current) return;
        const next = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = next; setUrl(next);
      } else if (action === 'score') {
        const response = await speakingRequest(user, `/${answer.id}/score`, { method: 'POST' });
        const data = await response.json() as { score: SpeakingScore };
        if (mounted.current) setScore(data.score);
      } else {
        await speakingRequest(user, `/${answer.id}`, { method: 'DELETE' });
        if (mounted.current) onDelete();
      }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { if (mounted.current) setBusy(''); }
  };
  return <article className="rounded-2xl border bg-card p-5 text-card-foreground">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{answer.source === 'upload' ? 'Uploaded answer' : 'Microphone recording'}</p><h2 className="mt-1 text-lg font-bold">{answer.title}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{answer.questionLabel || answer.questionId}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(answer.createdAt).toLocaleString()}</p></div>
      {score && <strong className="rounded-xl bg-primary/10 px-4 py-2 text-primary">{Math.round(score.overall)} / 90</strong>}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {!url && <button disabled={!!busy} onClick={() => void run('play')} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === 'play' ? 'Loading audio…' : 'Load recording to listen'}</button>}
      {!score && <button disabled={!!busy} onClick={() => void run('score')} className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy === 'score' ? 'Checking with AI…' : 'Check saved answer with AI'}</button>}
      <Link href={`/dashboard/practice/${answer.taskType}`} className="rounded-xl border px-4 py-2 text-sm font-semibold">Practise this task</Link>
      <button disabled={!!busy} onClick={() => setConfirmDelete(true)} className="rounded-xl px-4 py-2 text-sm text-destructive disabled:opacity-50">Delete</button>
    </div>
    {url && <div className="mt-4"><audio controls src={url} preload="metadata" className="w-full" aria-label={`Your ${answer.title} answer`} /><a href={url} download={`speaking-answer.${answer.mimeType === 'audio/mp4' ? 'm4a' : answer.mimeType === 'audio/mpeg' ? 'mp3' : answer.mimeType.split('/')[1]}`} className="mt-2 inline-block text-sm font-semibold text-primary underline">Download recording</a></div>}
    {confirmDelete && <div className="mt-4 rounded-xl border border-destructive/30 p-3"><p className="text-sm">Permanently delete this recording and its saved AI feedback?</p><div className="mt-2 flex gap-3"><button disabled={!!busy} onClick={() => void run('delete')} className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground disabled:opacity-50">Delete recording</button><button disabled={!!busy} onClick={() => setConfirmDelete(false)} className="text-sm underline">Keep recording</button></div></div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {score && <details className="mt-4 rounded-xl bg-muted/40 p-4"><summary className="cursor-pointer text-sm font-semibold">Saved AI feedback & transcript</summary><p className="mt-2 text-xs text-muted-foreground">Practice estimates, not official exam scores.</p><div className="mt-3 space-y-3">{[
      ...(score.content !== undefined ? [{ label: 'Content', value: score.content, feedback: score.contentFeedback }] : []),
      { label: 'Oral fluency', value: score.fluency, feedback: score.fluencyFeedback },
      { label: 'Pronunciation', value: score.pronunciation, feedback: score.pronunciationFeedback },
    ].map(row => <div key={row.label}><p className="text-sm font-semibold">{row.label}: {Math.round(row.value)} / 90</p><p className="text-sm text-muted-foreground">{row.feedback}</p></div>)}<p className="text-sm font-semibold">Transcript</p><p className="whitespace-pre-wrap text-sm">{score.transcript || 'No transcript available.'}</p>{score.tips?.length > 0 && <ul className="list-inside list-disc space-y-1 text-sm">{score.tips.map((tip, index) => <li key={index}>{tip}</li>)}</ul>}</div></details>}
  </article>;
}

export function SpeakingRecordingLibrary() {
  const { user } = useUser();
  const [answers, setAnswers] = useState<SpeakingRecording[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const version = ++generation.current;
    setAnswers([]); setCursor(null); setError('');
    if (!user) return;
    setBusy(true);
    speakingRequest(user).then(response => response.json()).then(data => {
      if (version === generation.current) { setAnswers(data.recordings); setCursor(data.nextCursor); }
    }).catch(e => { if (version === generation.current) setError(e.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    return () => { generation.current++; };
  }, [user, revision]);
  const loadMore = async () => {
    if (!user || !cursor || busy) return;
    const version = generation.current;
    setBusy(true); setError('');
    try {
      const data = await (await speakingRequest(user, `?before=${encodeURIComponent(cursor)}`)).json();
      if (version === generation.current) { setAnswers(previous => [...previous, ...data.recordings.filter((row: SpeakingRecording) => !previous.some(existing => existing.id === row.id))]); setCursor(data.nextCursor); }
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : 'Could not load recordings.'); }
    finally { if (version === generation.current) setBusy(false); }
  };
  if (!user) return <p className="rounded-2xl border p-5">Sign in to listen to your saved speaking answers.</p>;
  const shown = answers.filter(answer => filter === 'all' || answer.taskType === filter);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><label className="text-sm font-semibold">Filter loaded recordings<select value={filter} onChange={event => setFilter(event.target.value)} className="mt-2 block w-full rounded-xl border bg-background p-3 text-sm"><option value="all">All speaking tasks</option>{SPEAKING_TASKS.map(task => <option key={task} value={task}>{task.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}</option>)}</select></label><div className="flex items-center gap-3"><Link href="/credits" className="text-sm font-semibold text-primary underline">AI credits</Link><button disabled={busy} onClick={() => setRevision(value => value + 1)} className="rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-50">Refresh recordings</button></div></div>
    {error && <p role="alert" className="rounded-xl border p-4 text-sm text-destructive">{error}</p>}
    {busy && <p role="status" className="p-4 text-sm text-muted-foreground">Loading your recordings…</p>}
    {!busy && !error && !shown.length && <div className="rounded-2xl border bg-card p-6 text-center"><h2 className="font-bold">{answers.length ? 'No matches in the loaded recordings' : 'Your speaking journey starts here'}</h2><p className="mt-2 text-sm text-muted-foreground">{answers.length ? 'Choose another task or load older recordings below.' : 'Record or upload an answer in any PTE speaking task. Your saved audio and AI feedback will appear here.'}</p><Link href="/dashboard/pte/speaking" className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Open speaking practice</Link></div>}
    {shown.map(answer => <RecordingCard key={`${user.uid}:${answer.id}`} answer={answer} onDelete={() => setAnswers(previous => previous.filter(row => row.id !== answer.id))} />)}
    {cursor && <button disabled={busy} onClick={() => void loadMore()} className="w-full rounded-xl border p-3 text-sm font-semibold disabled:opacity-50">Load older recordings</button>}
  </div>;
}
