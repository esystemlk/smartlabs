'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, XCircle, Lightbulb, Trophy, RotateCcw } from 'lucide-react';
import type { PublicSkimStep, StepState, SkimStepProgress, SkimQuestionResult } from '@/lib/ielts-skimming/types';
import './skimming-runner.css';

interface LoadData {
  version: string;
  steps: PublicSkimStep[];
  states: Record<string, StepState>;
  progress: Record<string, SkimStepProgress>;
  badge: { awarded: boolean; at: number | null };
}
interface SubmitData {
  stepId: string; score: number; total: number; passMark: number; passed: boolean;
  results: SkimQuestionResult[];
  states: Record<string, StepState>;
  badge: { awarded: boolean; at: number | null; justEarned: boolean };
}

const STATE_LABEL: Record<StepState, string> = { locked: 'Locked', ready: 'Ready', in_progress: 'In progress', passed: 'Passed' };

export function SkimmingRunner() {
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<LoadData | null>(null);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Per-step attempt state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitData | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ielts/skimming', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not load the challenge.');
      setData(d as LoadData);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the challenge.'); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const active = useMemo(() => data?.steps.find((s) => s.id === activeId) ?? null, [data, activeId]);
  const passedCount = useMemo(() => data ? data.steps.filter((s) => data.states[s.id] === 'passed').length : 0, [data]);
  const allPassed = data ? passedCount === data.steps.length : false;

  function openStep(step: PublicSkimStep) {
    if (data?.states[step.id] === 'locked') return;
    setActiveId(step.id); setAnswers({}); setResult(null); setRevealed(new Set()); setShowUnanswered(false);
  }
  function backToDashboard() { setActiveId(null); setResult(null); void load(); }

  async function submit() {
    if (!active || !user) return;
    const unanswered = active.questions.filter((q) => answers[q.id] == null).length;
    if (unanswered > 0 && !showUnanswered) { setShowUnanswered(true); return; }
    setSubmitting(true); setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ielts/skimming', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stepId: active.id, answers }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not check your answers.');
      setResult(d as SubmitData);
      if (data) setData({ ...data, states: d.states, badge: d.badge });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check your answers.'); }
    finally { setSubmitting(false); }
  }

  function retry() { setAnswers({}); setResult(null); setRevealed(new Set()); setShowUnanswered(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function toggleTrick(id: string) { setRevealed((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  if (isUserLoading || (!data && !error)) return <div className="skim-wrap"><p className="skim-loading">Loading the Skimming Mastery Challenge…</p></div>;
  if (!user) return <div className="skim-wrap"><p className="skim-error">Please sign in to start the challenge.</p></div>;
  if (error && !data) return <div className="skim-wrap"><p className="skim-error">{error}</p></div>;
  if (!data) return null;

  // ── Step view ──
  if (active) {
    const resultById = new Map(result?.results.map((r) => [r.id, r]));
    return (
      <div className="skim-wrap">
        <button className="skim-back" onClick={backToDashboard}><ArrowLeft size={16} /> Back to levels</button>
        <header className="skim-step-head">
          <span className="skim-eyebrow">{active.id} · {active.level}</span>
          <h1>{active.title}</h1>
          <p className="skim-objective">{active.objective}</p>
          <p className="skim-passmark">Pass mark: {active.passMark} / {active.total}</p>
        </header>

        {result && (
          <div className={`skim-scorecard ${result.passed ? 'pass' : 'fail'}`} role="status">
            <div className="skim-score">{result.score}<span>/{result.total}</span></div>
            <div>
              <strong>{result.passed ? 'Level passed!' : 'Not quite — try again'}</strong>
              <p>{result.passed ? (result.badge.justEarned ? 'You passed the final level!' : 'The next level is now unlocked.') : `You need ${result.passMark} correct to pass. Review the explanations below, then retry.`}</p>
            </div>
          </div>
        )}

        <section className="skim-passage" aria-label="Reading passage">
          {active.passage.map((p) => (
            <p key={p.label}><b>Paragraph {p.label}:</b> {p.text}</p>
          ))}
        </section>

        <ol className="skim-questions">
          {active.questions.map((q, qi) => {
            const r = resultById.get(q.id);
            return (
              <li key={q.id} className="skim-q">
                <p className="skim-q-prompt"><span className="skim-q-num">{qi + 1}</span> {q.prompt}</p>
                <fieldset className="skim-options" disabled={!!result}>
                  <legend className="sr-only">{q.prompt}</legend>
                  {q.options.map((opt, oi) => {
                    const checked = answers[q.id] === oi;
                    const isCorrect = r && oi === r.correct;
                    const isWrongChoice = r && r.selected === oi && !r.isCorrect;
                    return (
                      <label key={oi} className={`skim-option ${isCorrect ? 'correct' : ''} ${isWrongChoice ? 'wrong' : ''}`}>
                        <input type="radio" name={q.id} value={oi} checked={checked}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />
                        <span className="skim-option-key">{String.fromCharCode(65 + oi)}</span>
                        <span className="skim-option-text">{opt}</span>
                        {isCorrect && <CheckCircle2 size={18} className="skim-ic-ok" aria-label="Correct answer" />}
                        {isWrongChoice && <XCircle size={18} className="skim-ic-no" aria-label="Your answer (incorrect)" />}
                      </label>
                    );
                  })}
                </fieldset>
                {r && (
                  <div className="skim-feedback">
                    {r.wrongReason && <p className="skim-why-wrong"><XCircle size={15} /> {r.wrongReason}</p>}
                    <p className="skim-teacher"><b>Why {String.fromCharCode(65 + r.correct)} is correct:</b> {r.teacherExplanation}</p>
                    <button type="button" className="skim-trick-btn" aria-expanded={revealed.has(q.id)} onClick={() => toggleTrick(q.id)}>
                      <Lightbulb size={15} /> {revealed.has(q.id) ? 'Hide the trick' : 'Reveal the Trick'}
                    </button>
                    {revealed.has(q.id) && <p className="skim-trick">{r.revealTrick}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {error && <p className="skim-error">{error}</p>}
        {!result ? (
          <div className="skim-actions">
            {showUnanswered && <p className="skim-warn">You have {active.questions.filter((q) => answers[q.id] == null).length} unanswered question(s). Finish them, or press again to submit as is.</p>}
            <button className="skim-submit" onClick={submit} disabled={submitting}>{submitting ? 'Checking…' : 'Check My Answers'}</button>
          </div>
        ) : (
          <div className="skim-actions">
            {!result.passed && <button className="skim-submit" onClick={retry}><RotateCcw size={16} /> Try again</button>}
            {result.passed && <button className="skim-submit" onClick={backToDashboard}>Back to levels <ArrowRight size={16} /></button>}
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="skim-wrap">
      <Link className="skim-back" href="/dashboard/ielts/reading"><ArrowLeft size={16} /> IELTS Reading</Link>
      <header className="skim-hero">
        <span className="skim-eyebrow">SKILL CHALLENGE</span>
        <h1>Skimming Mastery Challenge</h1>
        <p>Five progressive levels. Find the main idea, purpose and best heading — not the distractions. Score {Math.round(80)}%+ to unlock the next level.</p>
        <div className="skim-progressbar" role="progressbar" aria-valuenow={passedCount} aria-valuemin={0} aria-valuemax={data.steps.length}>
          <span style={{ width: `${(passedCount / data.steps.length) * 100}%` }} />
        </div>
        <p className="skim-progress-label">{passedCount} of {data.steps.length} levels passed</p>
      </header>

      {allPassed && (
        <div className="skim-badge-banner" role="status">
          <Trophy size={28} />
          <div><strong>You are now a Skimming Master!</strong><p>Your badge is saved to your profile.</p></div>
        </div>
      )}

      <ol className="skim-levels">
        {data.steps.map((s, i) => {
          const state = data.states[s.id];
          const p = data.progress[s.id];
          const locked = state === 'locked';
          return (
            <li key={s.id}>
              <button className={`skim-level ${state}`} onClick={() => openStep(s)} disabled={locked} aria-disabled={locked}>
                <span className="skim-level-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="skim-level-body">
                  <span className="skim-level-title">{s.title}</span>
                  <span className="skim-level-meta">{s.level} · {s.total} questions · pass {s.passMark}/{s.total}</span>
                  {p && p.bestScore != null && <span className="skim-level-best">Best: {p.bestScore}/{s.total} · {p.attempts} attempt{p.attempts === 1 ? '' : 's'}</span>}
                </span>
                <span className={`skim-chip ${state}`}>
                  {locked ? <Lock size={14} /> : state === 'passed' ? <CheckCircle2 size={14} /> : null}
                  {STATE_LABEL[state]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
