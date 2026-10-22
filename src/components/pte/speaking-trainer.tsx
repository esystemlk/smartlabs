'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CompactQuestionBank } from './compact-question-bank';
import { CreditsPill } from '@/components/pte/credits-pill';
import type { SpeakingScore } from '@/ai/flows/score-pte-speaking';
import { MAX_SPEAKING_AUDIO_BYTES } from '@/lib/speaking-recordings';
import { speakingRequest } from '@/lib/services/speaking-recordings.client';
import { useUser } from '@/firebase';
import {
  Mic, Square, Loader2, RotateCcw, Play, Search, ChevronLeft, ChevronRight,
  Shuffle, Volume2, ArrowLeft, Sparkles, ListChecks, AlertTriangle,
} from 'lucide-react';

// Fixed theme classes per catalogue hue (Tailwind can't build dynamic names).
const THEME: Record<string, { text: string; bg: string; soft: string; grad: string; ring: string; bar: string }> = {
  orange:  { text: 'text-orange-600',  bg: 'bg-orange-600',  soft: 'bg-orange-500/10',  grad: 'from-orange-500 to-amber-500',   ring: 'ring-orange-500/30',  bar: 'bg-orange-500' },
  violet:  { text: 'text-violet-600',  bg: 'bg-violet-600',  soft: 'bg-violet-500/10',  grad: 'from-violet-500 to-purple-500',  ring: 'ring-violet-500/30',  bar: 'bg-violet-500' },
  blue:    { text: 'text-blue-600',    bg: 'bg-blue-600',    soft: 'bg-blue-500/10',    grad: 'from-blue-500 to-cyan-500',      ring: 'ring-blue-500/30',    bar: 'bg-blue-500' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', soft: 'bg-emerald-500/10', grad: 'from-emerald-500 to-green-500',  ring: 'ring-emerald-500/30', bar: 'bg-emerald-500' },
  rose:    { text: 'text-rose-600',    bg: 'bg-rose-600',    soft: 'bg-rose-500/10',    grad: 'from-rose-500 to-pink-500',      ring: 'ring-rose-500/30',    bar: 'bg-rose-500' },
  amber:   { text: 'text-amber-600',   bg: 'bg-amber-600',   soft: 'bg-amber-500/10',   grad: 'from-amber-500 to-yellow-500',   ring: 'ring-amber-500/30',   bar: 'bg-amber-500' },
  cyan:    { text: 'text-cyan-600',    bg: 'bg-cyan-600',    soft: 'bg-cyan-500/10',    grad: 'from-cyan-500 to-sky-500',       ring: 'ring-cyan-500/30',    bar: 'bg-cyan-500' },
};
const theme = (c: string) => THEME[c] ?? THEME.blue;

/**
 * Live mic input-level meter shown while recording. Red = too quiet, green =
 * a good speaking volume, yellow = too loud / clipping — helps students
 * learn to manage their vocal level without staring at a plain waveform.
 */
function MicLevelMeter({ level }: { level: number }) {
  const zone = level < 25 ? 'low' : level < 80 ? 'good' : 'high';
  const label = zone === 'low' ? 'Too quiet — speak a little louder' : zone === 'good' ? 'Good volume' : 'Too loud — ease off a little';
  const labelColor = zone === 'low' ? 'text-rose-600' : zone === 'good' ? 'text-emerald-600' : 'text-amber-600';
  return (
    <div className="mx-auto mt-3 max-w-xs">
      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        style={{ background: 'linear-gradient(to right, #f43f5e 0%, #f43f5e 25%, #22c55e 25%, #22c55e 80%, #eab308 80%, #eab308 100%)' }}
      >
        <div
          className="absolute inset-y-0 w-1 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.3)] transition-[left] duration-100 ease-out"
          style={{ left: `calc(${level}% - 2px)` }}
        />
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${labelColor}`}>{label}</p>
    </div>
  );
}

export interface SpeakingQuestion { id: string }

interface Props<Q extends SpeakingQuestion> {
  taskType: string;
  title: string;
  subtitle: string;
  color: string;
  weight: string;
  questions: Q[];
  /** Reference text sent to the AI (paragraph / sentence / question / gist). */
  getPromptText: (q: Q) => string;
  /** Describe Image only: the question's actual image URL, sent to the AI so it scores the real picture. */
  getImageUrl?: (q: Q) => string | undefined;
  /** What the student sees on screen. */
  renderPrompt: (q: Q) => React.ReactNode;
  /** Text used for the search box. */
  searchText: (q: Q) => string;
  /** If set, the prompt is spoken aloud (TTS) before the student records. */
  speakPrompt?: (q: Q) => string | null;
  prepSeconds: number;
  recordSeconds: number;
  /** Short "how it works" line under the title. */
  instructions: string;
}

type Phase = 'idle' | 'listening' | 'prep' | 'recording' | 'scoring' | 'result' | 'error';

export function SpeakingTrainer<Q extends SpeakingQuestion>(p: Props<Q>) {
  const { user } = useUser();
  const t = theme(p.color);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<SpeakingScore | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [answerBlob, setAnswerBlob] = useState<Blob | null>(null);
  const [answerUrl, setAnswerUrl] = useState('');
  const [answerSource, setAnswerSource] = useState<'microphone' | 'upload'>('microphone');
  const [saved, setSaved] = useState(false);
  const [saveStage, setSaveStage] = useState('');
  const answerIdRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const operationRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!answerBlob) { setAnswerUrl(''); return; }
    const url = URL.createObjectURL(answerBlob);
    setAnswerUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [answerBlob]);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live mic input level (0-100), shown while recording so students can see
  // whether they're speaking too quietly, well, or too loudly/noisily.
  const [micLevel, setMicLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterRafRef = useRef<number | null>(null);
  const lastMeterPaintRef = useRef(0);

  const filtered = p.questions;
  const question = filtered[index] ?? filtered[0] ?? p.questions[0];

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const stopStream = () => { streamRef.current?.getTracks().forEach(tr => tr.stop()); streamRef.current = null; };

  // Reads the mic's live volume via an AnalyserNode (never routed to the
  // speakers — analysis only, no playback/feedback) and updates `micLevel`
  // at ~12fps so the meter animates smoothly without re-rendering every frame.
  const startMeter = (stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);
      const tick = (now: number) => {
        if (!analyserRef.current) return;
        if (now - lastMeterPaintRef.current > 80) {
          lastMeterPaintRef.current = now;
          analyser.getByteTimeDomainData(data);
          let sumSquares = 0;
          for (let i = 0; i < data.length; i++) {
            const n = (data[i] - 128) / 128;
            sumSquares += n * n;
          }
          const rms = Math.sqrt(sumSquares / data.length);
          const db = 20 * Math.log10(rms || 0.0001);
          // Map a typical mic's quiet (-55dB) to loud/clipping (-5dB) range to 0-100.
          const level = Math.max(0, Math.min(100, Math.round(((db + 55) / 50) * 100)));
          setMicLevel(level);
        }
        meterRafRef.current = requestAnimationFrame(tick);
      };
      meterRafRef.current = requestAnimationFrame(tick);
    } catch { /* meter is a visual aid only — never block recording if it fails */ }
  };

  const stopMeter = () => {
    if (meterRafRef.current) { cancelAnimationFrame(meterRafRef.current); meterRafRef.current = null; }
    analyserRef.current = null;
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setMicLevel(0);
  };

  const reset = useCallback(() => {
    attemptRef.current++;
    operationRef.current = false;
    clearTimer(); stopStream(); stopMeter();
    if (mediaRef.current) { mediaRef.current.onstop = null; if (mediaRef.current.state !== 'inactive') { try { mediaRef.current.stop(); } catch { /* ignore */ } } }
    mediaRef.current = null; chunksRef.current = [];
    answerIdRef.current = null; setAnswerBlob(null); setSaved(false); setSaveStage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPhase('idle'); setResult(null); setErrMsg(''); setCount(0);
  }, []);

  // Reset whenever the question changes.
  useEffect(() => { reset(); }, [question?.id, user?.uid, reset]);
  useEffect(() => () => { attemptRef.current++; clearTimer(); if (mediaRef.current) mediaRef.current.onstop = null; stopStream(); stopMeter(); window.speechSynthesis?.cancel(); }, []);

  const speak = (text: string) => new Promise<void>((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.onend = () => resolve(); u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    } catch { resolve(); }
  });

  const startRecording = useCallback(async () => {
    const attempt = attemptRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== attemptRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      startMeter(stream);
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stopStream(); stopMeter();
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || chunksRef.current[0]?.type || 'audio/webm' });
        setAnswerBlob(blob); setAnswerSource('microphone');
        void submit(blob, 'microphone');
      };
      mediaRef.current = mr;
      mr.start();
      setPhase('recording');
      setCount(p.recordSeconds);
      clearTimer();
      let remaining = p.recordSeconds;
      timerRef.current = setInterval(() => {
        remaining = Math.max(0, remaining - 1); setCount(remaining);
        if (remaining === 0) { clearTimer(); stopRecording(); }
      }, 1000);
    } catch {
      if (attempt !== attemptRef.current) return;
      stopStream(); stopMeter();
      setErrMsg('Microphone access was blocked. Please allow the mic and try again.');
      setPhase('error');
    }
    // eslint-disable-next-line
  }, [p, question, user]);

  const beginPrep = useCallback(async () => {
    if (!user) { setErrMsg('Sign in to save and check your speaking answers.'); setPhase('error'); return; }
    reset();
    const attempt = attemptRef.current;
    setResult(null); setErrMsg('');
    // Optionally play the prompt aloud first.
    const toSpeak = p.speakPrompt?.(question);
    if (toSpeak) { setPhase('listening'); await speak(toSpeak); }
    if (attempt !== attemptRef.current) return;
    setPhase('prep');
    setCount(p.prepSeconds);
    clearTimer();
    let remaining = p.prepSeconds;
    timerRef.current = setInterval(() => {
      remaining = Math.max(0, remaining - 1); setCount(remaining);
      if (remaining === 0) { clearTimer(); void startRecording(); }
    }, 1000);
  }, [question, p, startRecording, user, reset]); // eslint-disable-line

  const stopRecording = () => {
    clearTimer();
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
  };

  const submit = async (blob: Blob, source: 'microphone' | 'upload') => {
    if (operationRef.current) return;
    if (!user) { setErrMsg('Sign in to save and check your answer.'); setPhase('error'); return; }
    if (blob.size < 800 || blob.size > MAX_SPEAKING_AUDIO_BYTES) { setErrMsg('Choose an audio recording between 800 bytes and 4 MB.'); setPhase('error'); return; }
    operationRef.current = true;
    const attempt = attemptRef.current;
    setPhase('scoring');
    setErrMsg('');
    try {
      const id = answerIdRef.current ?? crypto.randomUUID();
      answerIdRef.current = id;
      setSaveStage('Saving your answer securely…');
      const form = new FormData();
      form.set('id', id); form.set('audio', blob, 'answer'); form.set('source', source);
      form.set('taskType', p.taskType); form.set('title', p.title); form.set('questionId', question.id);
      form.set('questionLabel', p.searchText(question)); form.set('promptText', p.getPromptText(question));
      await speakingRequest(user, '', { method: 'POST', body: form });
      if (attempt !== attemptRef.current) return;
      setSaved(true); setSaveStage('Saved. Checking your response with AI…');
      const response = await speakingRequest(user, `/${id}/score`, { method: 'POST' });
      const { score } = await response.json() as { score: SpeakingScore };
      if (attempt !== attemptRef.current) return;
      setResult(score); setPhase('result');
    } catch (e: unknown) {
      if (attempt !== attemptRef.current) return;
      setErrMsg(e instanceof Error ? e.message : 'Scoring failed. Please try again.');
      setPhase('error');
    } finally {
      if (attempt === attemptRef.current) operationRef.current = false;
    }
  };

  const go = (d: number) => { const n = (index + d + filtered.length) % filtered.length; setIndex(n); };
  const rand = () => setIndex(Math.floor(Math.random() * filtered.length));

  const busy = phase === 'prep' || phase === 'recording' || phase === 'listening' || phase === 'scoring';

  const chooseUpload = async (file?: File) => {
    if (!file || busy) return;
    reset();
    const attempt = attemptRef.current;
    if (file.size < 800 || file.size > MAX_SPEAKING_AUDIO_BYTES) { setErrMsg('Choose an audio file between 800 bytes and 4 MB.'); setPhase('error'); return; }
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('This file could not be opened. Please export it as MP3, M4A, WAV, OGG or WebM.')), 8000);
        audio.onloadedmetadata = () => { clearTimeout(timeout); resolve(audio.duration); };
        audio.onerror = () => { clearTimeout(timeout); reject(new Error('This audio format cannot be played. Please choose another file.')); };
        audio.src = url;
      });
      if (attempt !== attemptRef.current) return;
      if (!Number.isFinite(duration) || duration <= 0 || duration > p.recordSeconds + 1) throw new Error(`Use an answer no longer than ${p.recordSeconds} seconds for this question.`);
      setAnswerBlob(file); setAnswerSource('upload');
    } catch (error) {
      if (attempt === attemptRef.current) { setErrMsg(error instanceof Error ? error.message : 'Could not open this recording.'); setPhase('error'); }
    } finally { audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/pte/speaking" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Speaking practice</Link>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${t.text}`}>{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CreditsPill pool="speaking" />
          <Link href="/dashboard/speaking-recordings" className="rounded-xl border px-3 py-2 text-xs font-semibold">My recordings</Link>
          <span className={`hidden sm:inline-flex items-center gap-1 rounded-full ${t.soft} ${t.text} px-3 py-1 text-xs font-bold`}><Sparkles className="h-3 w-3" /> AI Score · {p.weight}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="order-last min-w-0 space-y-4 lg:order-first">
          <div className={`rounded-2xl border-2 bg-card p-5 md:p-6 ${busy ? `ring-2 ${t.ring}` : ''}`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.instructions}</p>
            <div className="min-h-[120px]">{p.renderPrompt(question)}</div>
          </div>

          {/* Recorder */}
          <div className="rounded-2xl border bg-card p-5 text-center">
            <p className="mb-4 text-sm text-muted-foreground">Record here or upload your own answer. Signed-in answers are saved privately for you to replay.</p>
            {!user && <Link href={`/login?redirect=${encodeURIComponent(`/dashboard/practice/${p.taskType}`)}`} className="mb-4 inline-block font-semibold text-primary underline">Sign in to save & check answers</Link>}
            {phase === 'idle' && (
              <button disabled={!user} onClick={beginPrep} className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${t.grad} px-6 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50`}>
                <Mic className="h-4 w-4" /> Start
              </button>
            )}
            {phase === 'listening' && <p className="flex items-center justify-center gap-2 text-sm font-medium"><Volume2 className="h-5 w-5 animate-pulse" /> Listen…</p>}
            {phase === 'prep' && (
              <div>
                <p className="text-sm text-muted-foreground">Get ready — recording starts in</p>
                <p className={`text-4xl font-black ${t.text}`}>{count}</p>
                <button onClick={() => { clearTimer(); void startRecording(); }} className="mt-2 text-xs text-primary underline">Skip & record now</button>
              </div>
            )}
            {phase === 'recording' && (
              <div>
                <div className="mb-2 flex items-center justify-center gap-2 text-rose-600"><span className="h-3 w-3 animate-pulse rounded-full bg-rose-600" /> <span className="font-bold">Recording… {count}s</span></div>
                <MicLevelMeter level={micLevel} />
                <button onClick={stopRecording} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white"><Square className="h-4 w-4" /> Stop & Score</button>
              </div>
            )}
            {phase === 'scoring' && <p role="status" className="flex items-center justify-center gap-2 text-sm font-medium"><Loader2 className="h-5 w-5 animate-spin" /> {saveStage}</p>}
            {phase === 'error' && (
              <div className="space-y-3">
                <p role="alert" className="flex items-center justify-center gap-2 text-sm text-rose-600"><AlertTriangle className="h-4 w-4" /> {errMsg}</p>
                {answerBlob && <button disabled={!user} onClick={() => void submit(answerBlob, answerSource)} className={`mr-2 rounded-xl ${t.bg} px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50`}>{saved ? 'Retry AI checking' : 'Retry saving & checking'}</button>}
                <button disabled={!user} onClick={beginPrep} className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Record a new answer</button>
              </div>
            )}
            {phase === 'result' && (
              <button onClick={beginPrep} className={`inline-flex items-center gap-2 rounded-xl ${t.bg} px-5 py-2.5 text-sm font-bold text-white`}><RotateCcw className="h-4 w-4" /> Record again</button>
            )}
            {!busy && <div className="mt-4 border-t pt-4 text-left">
              <label htmlFor="speaking-answer-upload" className="block text-sm font-bold">Or upload a prerecorded answer</label>
              <p id="speaking-upload-help" className="my-2 text-xs text-muted-foreground">Your own voice answering the question above. MP3, M4A, WAV, OGG or WebM · up to 4 MB · {p.recordSeconds} seconds maximum.</p>
              <input ref={fileInputRef} id="speaking-answer-upload" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/webm,.mp3,.m4a,.wav,.ogg,.webm" aria-describedby="speaking-upload-help" disabled={!user} onChange={event => void chooseUpload(event.target.files?.[0])} className="block w-full min-w-0 rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 disabled:opacity-50" />
            </div>}
            {answerUrl && <div className="mt-4 rounded-xl bg-muted/40 p-4 text-left">
              <p className="mb-2 text-sm font-semibold">Your {answerSource === 'upload' ? 'uploaded answer' : 'recorded answer'}</p>
              <audio controls preload="metadata" src={answerUrl} className="w-full" aria-label="Listen to your speaking answer" />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <a href={answerUrl} download={`speaking-answer.${answerBlob?.type.includes('mp4') ? 'm4a' : answerBlob?.type.includes('mpeg') ? 'mp3' : answerBlob?.type.includes('wav') ? 'wav' : answerBlob?.type.includes('ogg') ? 'ogg' : 'webm'}`} className="font-semibold underline">Download my answer</a>
                <span role="status">{saved ? 'Saved to My recordings.' : 'Not saved yet — keep this page open.'}</span>
              </div>
              {!busy && phase === 'idle' && answerSource === 'upload' && <button onClick={() => answerBlob && void submit(answerBlob, 'upload')} className={`mt-3 rounded-xl ${t.bg} px-5 py-2.5 text-sm font-bold text-white`}>Save & check with AI</button>}
            </div>}
          </div>

          {/* Result */}
          {phase === 'result' && result && (
            <div className="rounded-2xl border bg-card p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Your AI Score</h2>
                <div className="text-right">
                  <div className={`text-3xl font-black ${t.text}`}>{Math.round(result.overall)}<span className="text-base text-muted-foreground">/90</span></div>
                  <div className="text-xs text-muted-foreground">Overall</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  // Read Aloud has no Content category in real PTE scoring — Pearson scores it on
                  // Oral Fluency and Pronunciation only, so `content` is omitted by the AI for that task.
                  ...(result.content !== undefined ? [{ label: 'Content', v: result.content, fb: result.contentFeedback ?? '' }] : []),
                  { label: 'Oral Fluency', v: result.fluency, fb: result.fluencyFeedback },
                  { label: 'Pronunciation', v: result.pronunciation, fb: result.pronunciationFeedback },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">{row.label}</span><span className="font-bold">{Math.round(row.v)}/90</span></div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted"><div className={`h-2 rounded-full ${t.bar}`} style={{ width: `${(row.v / 90) * 100}%` }} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{row.fb}</p>
                  </div>
                ))}
              </div>
              {result.tips?.length > 0 && (
                <div className={`mt-4 rounded-xl ${t.soft} p-3`}>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><ListChecks className="h-3.5 w-3.5" /> Tips</p>
                  <ul className="list-inside list-disc space-y-0.5 text-sm">{result.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </div>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Show transcript</summary>
                <p className="mt-1 rounded-lg bg-muted/50 p-3 text-sm">{result.transcript || '—'}</p>
              </details>
            </div>
          )}
        </div>

        <div className="order-first lg:order-last"><CompactQuestionBank questions={p.questions} label={p.searchText} selectedIndex={index} onSelect={setIndex} disabled={busy} mobileCollapse /></div>
      </div>
    </div>
  );
}
