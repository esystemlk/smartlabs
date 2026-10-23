'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Award, ArrowRight, BookOpen, ChevronDown, Printer, Check, MessageSquare, Mic, Sparkles, Headphones, PenLine, Target, Layers3, Fingerprint } from 'lucide-react';
import { FULL_TASKS, PARTS, SKILLS } from '@/lib/full-mock';
import './full-mock-report.css';

export const PROFILE_GROUPS: Record<string, string[]> = {
  'Open response speaking & writing': ['describe-image', 'retell-lecture', 'summarize-group-discussion', 'respond-to-situation', 'swt', 'write-essay', 'summarize-spoken-text'],
  'Reproducing spoken & written language': ['read-aloud', 'repeat-sentence', 'write-from-dictation'],
  'Extended writing': ['swt', 'write-essay', 'summarize-spoken-text'],
  'Short writing': ['write-from-dictation'],
  'Extended speaking': ['describe-image', 'retell-lecture', 'summarize-group-discussion', 'respond-to-situation'],
  'Short speaking': ['read-aloud', 'repeat-sentence'],
  'Multiple skills comprehension': ['repeat-sentence', 'retell-lecture', 'summarize-group-discussion', 'swt', 'summarize-spoken-text', 'highlight-correct-summary', 'highlight-incorrect-words', 'write-from-dictation'],
  'Single skill comprehension': ['answer-short-question', 'respond-to-situation', 'rw-fill-blanks', 'mcq-multiple', 'reorder-paragraphs', 'fill-blanks', 'reading-mcq-single', 'listening-mcq-multiple', 'listening-fill-blanks', 'listening-mcq-single', 'select-missing-word'],
};

const COLOURS = {
  overall: { accent: '#7950ed', soft: '#f0eaff', icon: Award, caption: 'The complete picture' },
  listening: { accent: '#087fbc', soft: '#e5f5ff', icon: Headphones, caption: 'Listen. Understand. Connect.' },
  reading: { accent: '#087f70', soft: '#e3f7ed', icon: BookOpen, caption: 'Find meaning in every word' },
  speaking: { accent: '#c74d29', soft: '#fff0e6', icon: Mic, caption: 'Make your voice count' },
  writing: { accent: '#b93681', soft: '#fcebf4', icon: PenLine, caption: 'Put your ideas into words' },
};
const PROFILE_COLOURS = ['#7950ed', '#087fbc', '#b93681', '#c74d29', '#087f70', '#6250d3', '#137c98', '#a36b0a'];
const PART_COLOURS = ['#7950ed', '#087f70', '#087fbc'];
const vars = (accent: string, soft = '#f5f2ff') => ({ '--report-accent': accent, '--report-soft': soft } as CSSProperties);
const label = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

function Detail({ value }: { value: any }) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return <span className="whitespace-pre-wrap">{String(value)}</span>;
  if (Array.isArray(value)) return <ul className="space-y-3">{value.map((v, i) => <li key={i} className="sl-report-detail-item"><Detail value={v} /></li>)}</ul>;
  return <dl className="sl-report-detail-grid">{Object.entries(value).filter(([k]) => !k.startsWith('_')).map(([k, v]) => <div key={k} className="sl-report-detail-field"><dt>{label(k)}</dt><dd><Detail value={v} /></dd></div>)}</dl>;
}

function reference(r: any) {
  const s = r.source;
  if (s.blanks) return s.blanks.map((b: any, i: number) => `${i + 1}. ${b.correctAnswer}`).join(' · ');
  if (s.correctWords) return s.correctWords.join(' · ');
  if (s.correctAnswers) return s.correctAnswers.join('\n');
  if (s.correctSummaryId) return s.summaries?.find((v: any) => v.id === s.correctSummaryId)?.text;
  if (s.incorrectWords) return s.incorrectWords.join(' · ');
  if (s.paragraphs) return s.paragraphs.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n\n');
  return s.correctAnswer || s.answer || s.sampleAnswer || s.text || s.transcript || s.audioText || s.describe || 'Review the reference audio and scoring feedback.';
}

function ScoreCard({ skill, value }: { skill: keyof typeof COLOURS; value: number }) {
  const theme = COLOURS[skill];
  const Icon = theme.icon;
  const progress = Math.max(0, Math.min(1, (value - 10) / 80));
  return <article className={`sl-score-card ${skill === 'overall' ? 'sl-score-overall' : ''}`} style={vars(theme.accent, theme.soft)} aria-label={`${label(skill)} score ${value} out of 90`}>
    <div className="sl-score-card-top"><span className="sl-score-icon"><Icon size={19} strokeWidth={1.8} /></span><h2>{skill === 'overall' ? 'Overall score' : skill}</h2></div>
    <div className="sl-score-dial">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="sl-score-track" cx="60" cy="60" r="49" /><circle className="sl-score-progress" cx="60" cy="60" r="49" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress * 100} /></svg>
      <div className="sl-score-value"><strong>{value}</strong><span>out of 90</span></div>
    </div>
    <p className="sl-score-caption">{theme.caption}</p><p className="sl-score-estimate">Estimated practice score</p>
  </article>;
}

export function FullMockReport({ exam, api }: { exam: any; api: (body?: any, id?: string) => Promise<any> }) {
  const [part, setPart] = useState(-1);
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const rows: any[] = exam.review || [];
  const summary = FULL_TASKS.map(t => ({ ...t, rows: rows.filter(r => r.type === t.type), percent: rows.filter(r => r.type === t.type).reduce((a, r) => a + (r.score?.percent || 0), 0) / t.count }));
  const priorities = [...summary].sort((a, b) => a.percent - b.percent).slice(0, 3);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/mock/full-1?attemptId=${exam.id}`); setCopied(true); setCopyError(''); }
    catch { setCopyError('The link could not be copied. You can share the report URL from your address bar.'); }
  };

  return <div className="sl-report">
    <header className="sl-report-hero">
      <div className="sl-report-hero-pattern" aria-hidden="true"><svg viewBox="0 0 480 240"><path d="M-40 200C120 200 120 20 280 20S400 220 520 100" /><path d="M-40 220C120 220 120 40 280 40S400 240 520 120" /><path d="M-40 180C120 180 120 0 280 0S400 200 520 80" /></svg></div>
      <div className="sl-report-hero-copy">
        <div className="sl-report-brand"><span className="sl-report-brand-mark">S<span>✦</span></span><span>SMART LABS <span className="sl-report-brand-divider">/</span> SCORE STUDIO</span></div>
        <p className="sl-report-eyebrow">PTE ACADEMIC · FULL MOCK 01</p>
        <h1>Your performance,<br /><span>explained in colour.</span></h1>
        <p className="sl-report-hero-description">Understand every skill. Find your focus. Take your next step with a clearer direction.</p>
        <div className="sl-report-hero-tags"><span><Check size={14} /> {rows.length} responses reviewed</span><span><Layers3 size={14} /> {FULL_TASKS.length} task types</span><span><Fingerprint size={14} /> Your personal skills profile</span></div>
      </div>
      <div className="sl-report-hero-art" aria-hidden="true"><span className="sl-report-orbit sl-report-orbit-one" /><span className="sl-report-orbit sl-report-orbit-two" /><div className="sl-report-seal"><span>SMART LABS</span><Sparkles size={44} strokeWidth={1.2} /><strong>YOUR ENGLISH.<br />YOUR NEXT STEP.</strong><span>LEARN · PRACTISE · GROW</span></div><span className="sl-report-art-dot sl-report-dot-blue" /><span className="sl-report-art-dot sl-report-dot-coral" /><span className="sl-report-art-star">✦</span></div>
    </header>

    <div className="sl-report-toolbar print:hidden"><p><span className="sl-report-live-dot" /> Assessment complete <span className="sl-report-toolbar-divider">/</span> Keep this report for your next lecturer session</p><div><button className="sl-report-button sl-report-button-light" onClick={() => window.print()}><Printer size={16} /> Print report</button><button className="sl-report-button sl-report-button-dark" onClick={() => void copyLink()}>{copied ? <Check size={16} /> : <MessageSquare size={16} />}{copied ? 'Link copied' : 'Share with your lecturer'}</button></div></div>
    {copyError && <p role="alert" className="sl-report-copy-error">{copyError}</p>}

    <section className="sl-score-grid" aria-label="Score overview">{SKILLS.map(skill => <ScoreCard key={skill} skill={skill} value={exam.results?.[skill]} />)}</section>
    <details className="sl-report-method"><summary><span><Award size={15} /> About your practice scores</span><ChevronDown size={15} /></summary><p>These Smart Labs practice estimates use normalized average question weights and a linear 10–90 conversion. Overall is calculated independently from question contributions. Pearson’s official scores also use proprietary difficulty calibration and cannot be reproduced from the weighting table. Published “&lt;1%” Overall entries use 0.5% in this mock.</p></details>

    <section className="sl-report-panel sl-report-profile">
      <div className="sl-report-section-heading"><div><p className="sl-report-kicker">THE BIGGER PICTURE</p><h2>Your Skills Profile<span className="sl-report-heading-spark">✦</span></h2><p>Discover your strengths across the ways you use English.</p></div><span className="sl-report-section-icon"><Fingerprint size={28} strokeWidth={1.4} /></span></div>
      <div className="sl-report-profile-grid">{Object.entries(PROFILE_GROUPS).map(([name, types], i) => {
        const relevant = summary.filter(t => types.includes(t.type));
        const value = relevant.reduce((a, t) => a + t.percent, 0) / relevant.length;
        const status = value >= 80 ? 'Strong' : value >= 55 ? 'Developing' : 'Focus area';
        return <details key={name} className="sl-profile-item" style={vars(PROFILE_COLOURS[i])}>
          <summary><div className="sl-profile-top"><span className="sl-profile-number">{String(i + 1).padStart(2, '0')}</span><span className={`sl-report-status sl-report-status-${value >= 80 ? 'strong' : value >= 55 ? 'developing' : 'focus'}`}>{status}</span></div><div className="sl-profile-name"><h3>{name}</h3><ChevronDown size={15} /></div><div className="sl-profile-track" role="meter" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${value}%` }} /></div></summary>
          <p className="sl-profile-explanation">Based on {relevant.map(t => t.label).join(', ')}. Review these responses below to find specific improvements.</p>
        </details>;
      })}</div>
      <p className="sl-report-profile-note">These bars show relative strengths, not 10–90 scores. A full bar does not represent a score of 90.</p>
    </section>

    <section className="sl-report-priorities"><div className="sl-report-section-heading"><div><p className="sl-report-kicker">TURN FEEDBACK INTO PROGRESS</p><h2>Your next three focus areas</h2><p>A practical starting point for your next study session.</p></div><Target size={28} className="text-violet-500" /></div><div className="sl-priority-grid">{priorities.map((t, i) => <a key={t.type} href={`#task-${t.type}`} className={`sl-priority-card sl-priority-${i}`}><div className="sl-priority-top"><span>FOCUS {String(i + 1).padStart(2, '0')}</span><ArrowRight size={20} /></div><h3>{t.label}</h3><p>Compare {t.rows.length} {t.rows.length === 1 ? 'response' : 'responses'} with the reference. Work with your lecturer on the criteria with the largest gaps.</p><span className="sl-priority-link">Explore your answers <ArrowRight size={14} /></span></a>)}</div></section>

    <section className="sl-report-panel"><div className="sl-report-section-heading"><div><p className="sl-report-kicker">THE DETAILS THAT MATTER</p><h2>Performance by question type</h2><p>See where each part of your test stands.</p></div><Layers3 size={26} className="text-violet-500" /></div><div className="sl-report-table-wrap"><table className="sl-report-table"><thead><tr><th>Question type</th><th>Questions</th><th>Practice accuracy</th><th><span className="sr-only">Review</span></th></tr></thead><tbody>{summary.map(t => <tr key={t.type}><td><span className="sl-report-task-label">{t.label}</span><span className="sl-report-part-tag" style={vars(PART_COLOURS[t.part])}>{PARTS[t.part].label}</span></td><td><span className="sl-report-count">{t.count}</span></td><td><div className="sl-report-table-progress" style={vars(PART_COLOURS[t.part])}><span className="sl-report-table-track"><span style={{ width: `${t.percent}%` }} /></span><strong>{Math.round(t.percent)}%</strong></div></td><td><a href={`#task-${t.type}`} className="sl-report-open-link" aria-label={`Review ${t.label} in ${PARTS[t.part].label}`}><ArrowRight size={17} /></a></td></tr>)}</tbody></table></div></section>

    <section className="sl-report-answers"><div className="sl-report-section-heading"><div><p className="sl-report-kicker">YOUR RESPONSE REVIEW</p><h2>Small details. Better next attempts.</h2><p>Compare, listen, and leave with something specific to practise.</p></div><label className="sl-report-focus-toggle"><input type="checkbox" checked={onlyWeak} onChange={e => setOnlyWeak(e.target.checked)} /> Focus areas only (&lt;65%)</label></div><div className="sl-report-tabs print:hidden">{['All sections', ...PARTS.map(p => p.label)].map((p, i) => <button key={p} aria-pressed={part === i - 1} className={part === i - 1 ? 'sl-report-tab-active' : ''} onClick={() => setPart(i - 1)}>{p}</button>)}</div>
      {summary.filter(t => part < 0 || t.part === part).map(t => <div key={t.type} id={`task-${t.type}`} className="sl-answer-task" style={vars(PART_COLOURS[t.part])}><h3 className="sl-answer-task-heading"><span />{t.label}<small>{PARTS[t.part].label}</small></h3><div className="space-y-3">{t.rows.filter(r => !onlyWeak || r.score?.percent < 65).map(r => <details key={r.index} className="sl-answer-card"><summary><span className="sl-answer-number">Q{String(r.index + 1).padStart(2, '0')}</span><span className="sl-answer-title">{r.source.title || t.label}</span><span className={`sl-answer-mark ${r.score.percent < 65 ? 'sl-answer-mark-focus' : ''}`}><strong>{Math.round(r.score.percent)}%</strong><small>{Number(r.score.raw.toFixed(2))}/{Number(r.score.max.toFixed(2))} marks</small></span><ChevronDown size={17} /></summary>
        <div className="sl-answer-body"><div className="sl-answer-comparison"><div className="sl-answer-reference"><h4><BookOpen size={15} /> Question / reference</h4>{r.source.passage && <p>{r.source.passage}</p>}{r.source.topic && <p>{r.source.topic}</p>}{r.source.situation && <p>{r.source.situation}</p>}{r.source.question && <p>{r.source.question}</p>}{r.imageUrl && <img src={r.imageUrl} alt="Question reference" className="mb-4 max-h-60 w-full object-contain" />}{r.referenceAudioUrl && <audio src={r.referenceAudioUrl} controls className="mb-4 w-full" />}<p>{Array.isArray(reference(r)) ? reference(r).join(' ') : reference(r)}</p>{r.source.sampleAnswer && <small>Sample wording is an example. Equivalent valid responses are accepted.</small>}</div><div className="sl-answer-response"><h4><PenLine size={15} /> Student response</h4>{r.audioUrl && <audio controls src={r.audioUrl} className="mb-4 w-full" />}<p>{Array.isArray(r.answer) ? r.answer.map((v: any, i: number) => `${i + 1}. ${t.type === 'reorder-paragraphs' ? r.source.paragraphs[r.source.paragraphIds ? r.source.paragraphIds.indexOf(String(v)) : v] : t.type === 'highlight-incorrect-words' ? r.source.transcript[v] : v}`).join('\n') : r.answer || (!r.audioUrl ? 'No response submitted.' : 'See recording and transcript below.')}</p></div></div>
          {r.score.detail && <div className="sl-answer-feedback"><h4><Sparkles size={17} /> Assessment and feedback</h4><Detail value={r.score.detail} /></div>}
          {r.lecturerNote && <div className="sl-lecturer-feedback"><h4><MessageSquare size={16} /> Your lecturer’s notes</h4><p>{r.lecturerNote}</p></div>}
          {exam.canAnnotate && <LecturerNote id={exam.id} index={r.index} initial={r.lecturerNote} api={api} />}
        </div></details>)}</div>{onlyWeak && !t.rows.some(r => r.score?.percent < 65) && <p className="sl-report-empty-focus"><Check size={15} /> No responses below 65% in this question type.</p>}</div>)}
    </section>
    <footer className="sl-report-footer"><div><span className="sl-report-footer-brand">SMART LABS<span>✦</span></span><p>More understanding. More confident practice.</p></div><Link href="/mock-tests" className="sl-report-button sl-report-button-dark print:hidden">Back to Mock Tests <ArrowRight size={16} /></Link></footer>
  </div>;
}

function LecturerNote({ id, index, initial, api }: { id: string; index: number; initial: string; api: (b: any) => Promise<any> }) {
  const [note, setNote] = useState(initial || '');
  const [status, setStatus] = useState('');
  return <div className="sl-lecturer-editor"><label>Lecturer review<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={5000} placeholder="Record a specific correction and a practice goal…" /></label><div><button className="sl-report-button sl-report-button-teal" onClick={async () => { try { setStatus('Saving…'); await api({ action: 'note', attemptId: id, index, note }); setStatus('Saved'); } catch (e) { setStatus((e as Error).message); } }}>Save lecturer note</button><span role="status">{status}</span></div></div>;
}
