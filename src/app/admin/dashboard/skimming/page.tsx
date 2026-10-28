'use client';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import type { SkimContent, SkimStep, SkimQuestion } from '@/lib/ielts-skimming/types';
import { passThreshold } from '@/lib/ielts-skimming/types';

const emptyQuestion = (stepId: string, n: number): SkimQuestion => ({
  id: `${stepId}-Q${String(n).padStart(2, '0')}`, prompt: '', options: ['', ''], correct: 0,
  teacherExplanation: '', revealTrick: '', wrongReasons: {},
});
const emptyStep = (n: number): SkimStep => {
  const id = `SKIM-${String(n).padStart(2, '0')}`;
  return { id, title: '', level: '', objective: '', passage: [{ label: 'A', text: '' }], questions: [emptyQuestion(id, 1)] };
};

export default function AdminSkimmingPage() {
  const { user } = useUser();
  const [content, setContent] = useState<SkimContent | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/skimming', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load');
      setContent(d.content as SkimContent);
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Failed to load'); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  function edit(mutate: (draft: SkimContent) => void) {
    setContent((c) => { if (!c) return c; const draft = structuredClone(c) as SkimContent; mutate(draft); return draft; });
  }

  async function save() {
    if (!content || !user) return;
    setSaving(true); setStatus('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/skimming', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setStatus(`Published edition ${d.version}.`);
    } catch (e) { setStatus(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  if (!content) return <div style={{ padding: 24 }}>{status || 'Loading Skimming content…'}</div>;

  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', margin: '10px 0 4px' };
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 };
  const btn: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 };
  const card: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 16, background: '#fff' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 4px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>Skimming Mastery — content editor</h1>
      <p style={{ color: '#64748b', margin: '6px 0 16px' }}>Edit passages, questions, correct answers and feedback. Publishing overwrites the live edition; bump the <b>version</b> to start a fresh edition (past student attempts are kept under the old version).</p>

      <div style={{ ...card, position: 'sticky', top: 8, zIndex: 5, display: 'flex', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 160px' }}>
          <label style={lbl}>Version</label>
          <input style={inp} value={content.version} onChange={(e) => edit((d) => { d.version = e.target.value; })} />
        </div>
        <button style={{ ...btn, background: '#4f46e5', color: '#fff', border: 0, padding: '10px 20px', fontSize: 14 }} onClick={save} disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</button>
        {status && <span style={{ color: status.includes('Published') ? '#16a34a' : '#b91c1c', fontWeight: 700 }}>{status}</span>}
      </div>

      {content.steps.map((step, si) => (
        <div key={step.id} style={{ ...card, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{step.id} <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>· pass {passThreshold(step.questions.length)}/{step.questions.length}</span></h2>
            <button style={btn} onClick={() => edit((d) => { d.steps.splice(si, 1); })}>Remove level</button>
          </div>
          <label style={lbl}>Title</label><input style={inp} value={step.title} onChange={(e) => edit((d) => { d.steps[si].title = e.target.value; })} />
          <label style={lbl}>Level label</label><input style={inp} value={step.level} onChange={(e) => edit((d) => { d.steps[si].level = e.target.value; })} />
          <label style={lbl}>Learning objective</label><input style={inp} value={step.objective} onChange={(e) => edit((d) => { d.steps[si].objective = e.target.value; })} />

          <h3 style={{ ...lbl, fontSize: 13, marginTop: 16 }}>Passage paragraphs</h3>
          {step.passage.map((para, pi) => (
            <div key={pi} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inp, width: 56 }} value={para.label} onChange={(e) => edit((d) => { d.steps[si].passage[pi].label = e.target.value; })} />
              <textarea style={{ ...inp, minHeight: 60 }} value={para.text} onChange={(e) => edit((d) => { d.steps[si].passage[pi].text = e.target.value; })} />
              <button style={btn} onClick={() => edit((d) => { d.steps[si].passage.splice(pi, 1); })}>✕</button>
            </div>
          ))}
          <button style={btn} onClick={() => edit((d) => { d.steps[si].passage.push({ label: String.fromCharCode(65 + d.steps[si].passage.length), text: '' }); })}>+ Paragraph</button>

          <h3 style={{ ...lbl, fontSize: 13, marginTop: 16 }}>Questions</h3>
          {step.questions.map((q, qi) => (
            <div key={qi} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <input style={{ ...inp, width: 160, fontWeight: 700 }} value={q.id} onChange={(e) => edit((d) => { d.steps[si].questions[qi].id = e.target.value; })} />
                <button style={btn} onClick={() => edit((d) => { d.steps[si].questions.splice(qi, 1); })}>Remove question</button>
              </div>
              <label style={lbl}>Prompt</label><input style={inp} value={q.prompt} onChange={(e) => edit((d) => { d.steps[si].questions[qi].prompt = e.target.value; })} />
              <label style={lbl}>Options (select the correct one)</label>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="radio" name={`${q.id}-correct`} checked={q.correct === oi} onChange={() => edit((d) => { d.steps[si].questions[qi].correct = oi; })} />
                  <span style={{ fontWeight: 700, color: '#64748b' }}>{String.fromCharCode(65 + oi)}</span>
                  <input style={inp} value={opt} onChange={(e) => edit((d) => { d.steps[si].questions[qi].options[oi] = e.target.value; })} />
                  {q.correct !== oi && (
                    <input style={{ ...inp, flex: 1.4 }} placeholder="Why this wrong option is tempting but wrong"
                      value={q.wrongReasons[String(oi)] ?? ''} onChange={(e) => edit((d) => { d.steps[si].questions[qi].wrongReasons[String(oi)] = e.target.value; })} />
                  )}
                  <button style={btn} onClick={() => edit((d) => { const qq = d.steps[si].questions[qi]; qq.options.splice(oi, 1); if (qq.correct >= qq.options.length) qq.correct = 0; })}>✕</button>
                </div>
              ))}
              <button style={btn} onClick={() => edit((d) => { d.steps[si].questions[qi].options.push(''); })}>+ Option</button>
              <label style={lbl}>Teacher explanation (why the correct answer is right)</label>
              <textarea style={{ ...inp, minHeight: 50 }} value={q.teacherExplanation} onChange={(e) => edit((d) => { d.steps[si].questions[qi].teacherExplanation = e.target.value; })} />
              <label style={lbl}>Reveal the Trick</label>
              <textarea style={{ ...inp, minHeight: 50 }} value={q.revealTrick} onChange={(e) => edit((d) => { d.steps[si].questions[qi].revealTrick = e.target.value; })} />
            </div>
          ))}
          <button style={btn} onClick={() => edit((d) => { d.steps[si].questions.push(emptyQuestion(step.id, d.steps[si].questions.length + 1)); })}>+ Question</button>
        </div>
      ))}

      <button style={{ ...btn, marginTop: 8 }} onClick={() => edit((d) => { d.steps.push(emptyStep(d.steps.length + 1)); })}>+ Add level</button>
    </div>
  );
}
