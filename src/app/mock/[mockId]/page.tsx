'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { WalkingLoader } from '@/components/ui/walking-loader';
import { MockResults } from '@/components/mock/MockResults';
import {
  WARN_AT_SECONDS, DANGER_AT_SECONDS, MOCK_AUDIO_PLAYS, formatClock,
  type MockTaskScore, type MockOverall,
} from '@/types/mock-test';
import {
  Loader2, Volume2, Play, AlertTriangle, ArrowRight, Lock, ShieldAlert,
} from 'lucide-react';

interface CurrentQuestion {
  index: number;
  total: number;
  taskType: string;
  label: string;
  instructions: string;
  deadlineAt: number;
  answer: string;
  title: string;
  content: string;
  audioUrl: string;
}

type Phase = 'loading' | 'intro' | 'exam' | 'scoring' | 'results' | 'error';

export default function MockExamPage() {
  const { mockId } = useParams<{ mockId: string }>();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [needCredit, setNeedCredit] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [mockTitle, setMockTitle] = useState('');
  const [current, setCurrent] = useState<CurrentQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [plays, setPlays] = useState(0);

  const [taskScores, setTaskScores] = useState<MockTaskScore[] | null>(null);
  const [overall, setOverall] = useState<MockOverall | null>(null);

  // Refs avoid stale closures inside the 1s timer.
  const answerRef = useRef('');
  const skewRef = useRef(0); // serverNow - clientNow
  const advancingRef = useRef(false);
  const blurCount = useRef(0);
  const pasteCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { answerRef.current = answer; }, [answer]);

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const token = await user!.getIdToken();
    return fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
  }, [user]);

  // ── Load the current question from the server ──
  const loadAttempt = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/mock/attempt/${id}`);
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Could not load the exam.');

    skewRef.current = d.serverNow - Date.now();
    setMockTitle(d.attempt.mockTitle ?? '');

    if (d.attempt.status === 'scored') {
      setTaskScores(d.attempt.taskScores);
      setOverall(d.attempt.overall);
      setPhase('results');
      return;
    }
    if (!d.current) { await submitExam(id); return; }

    setCurrent(d.current);
    setAnswer(d.current.answer ?? '');
    answerRef.current = d.current.answer ?? '';
    setPlays(0);
    setPhase('exam');
    advancingRef.current = false;
    setAdvancing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authedFetch]);

  // ── Start / resume ──
  const beginExam = useCallback(async () => {
    setPhase('loading'); setError(null); setNeedCredit(false);
    try {
      const res = await authedFetch('/api/mock/start', {
        method: 'POST',
        body: JSON.stringify({ mockId }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.code === 'NO_MOCK_CREDITS') { setNeedCredit(true); setPhase('error'); setError(d.error); return; }
        throw new Error(d.details ? `${d.error} (${d.details.join('; ')})` : d.error);
      }
      setAttemptId(d.attemptId);
      await loadAttempt(d.attemptId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the exam.');
      setPhase('error');
    }
  }, [authedFetch, mockId, loadAttempt]);

  // ── Submit for scoring ──
  const submitExam = useCallback(async (id: string) => {
    setPhase('scoring');
    try {
      const res = await authedFetch('/api/mock/submit', {
        method: 'POST',
        body: JSON.stringify({ attemptId: id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Scoring failed.');
      setTaskScores(d.attempt.taskScores);
      setOverall(d.attempt.overall);
      setPhase('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scoring failed.');
      setPhase('error');
    }
  }, [authedFetch]);

  // ── Save + move on (used by both the Next button and the timer) ──
  const goNext = useCallback(async (auto: boolean) => {
    if (!attemptId || !current || advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    try {
      const res = await authedFetch('/api/mock/save', {
        method: 'POST',
        body: JSON.stringify({
          attemptId,
          index: current.index,
          answer: answerRef.current,
          advance: true,
          blurCount: blurCount.current,
          pasteCount: pasteCount.current,
        }),
      });
      const d = await res.json();
      if (d.finished) { await submitExam(attemptId); return; }
      await loadAttempt(attemptId);
    } catch {
      // Never strand the student on a dead screen — re-sync from the server.
      await loadAttempt(attemptId).catch(() => {
        setError('Connection lost. Please refresh to continue.');
        setPhase('error');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, current, authedFetch, loadAttempt, submitExam]);

  // ── Countdown driven by the server deadline, not elapsed client time ──
  useEffect(() => {
    if (phase !== 'exam' || !current) return;
    const tick = () => {
      const now = Date.now() + skewRef.current;
      const left = Math.max(0, Math.round((current.deadlineAt - now) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !advancingRef.current) void goNext(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, current, goNext]);

  // ── Periodic autosave so nothing typed is ever lost ──
  useEffect(() => {
    if (phase !== 'exam' || !attemptId || !current) return;
    const t = setInterval(() => {
      if (advancingRef.current) return;
      void authedFetch('/api/mock/save', {
        method: 'POST',
        body: JSON.stringify({ attemptId, index: current.index, answer: answerRef.current }),
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [phase, attemptId, current, authedFetch]);

  // ── Integrity signals + leave warning ──
  useEffect(() => {
    if (phase !== 'exam') return;
    const onBlur = () => { blurCount.current += 1; };
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('blur', onBlur);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase]);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace(`/login?redirect=/mock/${mockId}`);
  }, [user, isUserLoading, mockId, router]);

  useEffect(() => { if (user && phase === 'loading' && !attemptId) setPhase('intro'); }, [user, phase, attemptId]);

  // ── Render ──
  if (isUserLoading || phase === 'loading') {
    return <Center><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></Center>;
  }

  if (phase === 'error') {
    return (
      <Center>
        <ShieldAlert className="h-10 w-10 text-red-400 mb-4" />
        <h1 className="text-xl font-black text-slate-900">Can&apos;t start the exam</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-md">{error}</p>
        <div className="flex gap-3 mt-6">
          {needCredit ? (
            <button onClick={() => router.push('/mock-tests')} className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">
              Get a mock credit
            </button>
          ) : (
            <button onClick={beginExam} className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">
              Try again
            </button>
          )}
        </div>
      </Center>
    );
  }

  if (phase === 'intro') {
    return (
      <Center>
        <div className="max-w-lg w-full text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Writing Mock Test</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Before you begin</h1>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {[
              'The exam runs on a server timer — closing or refreshing the tab does not pause it.',
              'When a question\'s time ends it moves on automatically and whatever you typed is kept.',
              'You cannot return to a previous question, exactly like the real exam.',
              `Audio in the listening tasks plays ${MOCK_AUDIO_PLAYS === 1 ? 'once only' : `${MOCK_AUDIO_PLAYS} times`}.`,
              'One mock credit is used when you start.',
            ].map(t => (
              <li key={t} className="flex gap-2"><span className="text-slate-300 font-bold">•</span><span>{t}</span></li>
            ))}
          </ul>
          <button onClick={beginExam} className="mt-8 w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm">
            Start Exam
          </button>
        </div>
      </Center>
    );
  }

  if (phase === 'scoring') {
    return (
      <Center>
        <WalkingLoader size={180} message="Marking your exam — this can take a minute." />
        <p className="text-slate-400 text-xs mt-3">Please keep this tab open.</p>
      </Center>
    );
  }

  if (phase === 'results' && taskScores && overall) {
    return <MockResults title={mockTitle} taskScores={taskScores} overall={overall} />;
  }

  if (!current) return <Center><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></Center>;

  const danger = secondsLeft <= DANGER_AT_SECONDS;
  const warn = !danger && secondsLeft <= WARN_AT_SECONDS;
  const isAudio = current.taskType === 'write-from-dictation' || current.taskType === 'summarize-spoken-text';
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Exam bar — deliberately bare, like the real test */}
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-sm font-black text-slate-700">{current.label}</span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500">
              {current.index + 1} of {current.total}
            </span>
            <span className={`text-sm font-black tabular-nums px-3 py-1 rounded-lg ${
              danger ? 'bg-red-50 text-red-600 animate-pulse'
                : warn ? 'bg-amber-50 text-amber-600'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {formatClock(secondsLeft)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8">
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{current.instructions}</p>

        {isAudio && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6 flex items-center gap-4">
            <button
              onClick={async () => {
                if (plays >= MOCK_AUDIO_PLAYS || !audioRef.current) return;
                try { audioRef.current.currentTime = 0; await audioRef.current.play(); setPlays(p => p + 1); } catch { /* ignore */ }
              }}
              disabled={plays >= MOCK_AUDIO_PLAYS || !current.audioUrl}
              className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <Play size={22} className="ml-0.5" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">
                {plays === 0 ? 'Play the audio' : plays >= MOCK_AUDIO_PLAYS ? 'Audio finished' : 'Playing'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {current.audioUrl ? `Plays ${MOCK_AUDIO_PLAYS === 1 ? 'once' : `${MOCK_AUDIO_PLAYS} times`} — ${plays}/${MOCK_AUDIO_PLAYS} used.` : 'Audio unavailable for this question.'}
              </p>
            </div>
            <Volume2 size={20} className="text-slate-300" />
            <audio ref={audioRef} src={current.audioUrl || undefined} className="hidden" />
          </div>
        )}

        {current.content && (
          <div className="rounded-2xl border border-slate-200 p-5 mb-6 bg-white">
            {current.title && <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{current.title}</p>}
            <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">{current.content}</p>
          </div>
        )}

        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onPaste={() => { pasteCount.current += 1; }}
          autoFocus
          rows={current.taskType === 'write-essay' ? 14 : current.taskType === 'write-from-dictation' ? 3 : 6}
          placeholder="Type your answer here…"
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-400/30"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-semibold text-slate-500">{words} words</span>
          {warn && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <AlertTriangle size={13} /> Less than 2 minutes left
            </span>
          )}
        </div>

        <button
          onClick={() => goNext(false)}
          disabled={advancing}
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm disabled:opacity-50"
        >
          {advancing ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : current.index + 1 === current.total ? <>Finish Exam <ArrowRight size={16} /></>
            : <>Next <ArrowRight size={16} /></>}
        </button>

        <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Lock size={12} /> Answers save automatically. You cannot return to this question.
        </p>
      </main>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  );
}
