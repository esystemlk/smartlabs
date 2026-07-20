'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Loader2, ClipboardList, Trash2, Pencil, X, Check,
  AlertTriangle, Clock, Users, Music, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { listQuestions } from '@/lib/services/pte-questions.service';
import type { PteQuestion, PteSection } from '@/types/pte-question';
import {
  MOCK_BLUEPRINT, MOCK_TOTAL_QUESTIONS, MOCK_TOTAL_SECONDS,
  formatDuration, type MockSection, type MockTest, type MockTaskType,
} from '@/types/mock-test';

/** Which PTE section each mock task lives in, for the question-bank lookup. */
const SECTION_OF: Record<MockTaskType, PteSection> = {
  swt: 'writing',
  'write-essay': 'writing',
  'summarize-spoken-text': 'listening',
  'write-from-dictation': 'listening',
};

const emptySections = (): MockSection[] =>
  MOCK_BLUEPRINT.map(b => ({
    taskType: b.taskType,
    questionIds: [],
    secondsPerQuestion: b.secondsPerQuestion,
  }));

export default function MockTestsAdminPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Question bank, grouped by task type
  const [bank, setBank] = useState<Record<string, PteQuestion[]>>({});
  const [bankLoading, setBankLoading] = useState(true);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<MockSection[]>(emptySections());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    return fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
  }, [user]);

  const loadMocks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authedFetch('/api/admin/mock-tests');
      const d = await res.json();
      if (res.ok) { setMocks(d.mocks ?? []); setAttemptCounts(d.attemptCounts ?? {}); }
      else toast({ variant: 'destructive', title: d.error || 'Failed to load mocks' });
    } finally { setLoading(false); }
  }, [user, authedFetch, toast]);

  useEffect(() => { loadMocks(); }, [loadMocks]);

  // Pull every task type's questions once
  useEffect(() => {
    (async () => {
      setBankLoading(true);
      try {
        const entries = await Promise.all(
          MOCK_BLUEPRINT.map(async b => [b.taskType, await listQuestions(SECTION_OF[b.taskType], b.taskType)] as const)
        );
        setBank(Object.fromEntries(entries));
      } catch {
        toast({ variant: 'destructive', title: 'Failed to load the question bank' });
      } finally { setBankLoading(false); }
    })();
  }, [toast]);

  const startNew = () => {
    setEditId(null); setTitle(''); setDescription('');
    setSections(emptySections()); setErrors([]); setEditing(true);
  };

  const startEdit = (m: MockTest) => {
    setEditId(m.id ?? null);
    setTitle(m.title);
    setDescription(m.description ?? '');
    // Merge stored sections onto the blueprint so shape is always complete.
    setSections(emptySections().map(b => {
      const found = m.sections?.find(s => s.taskType === b.taskType);
      return found ? { ...b, questionIds: [...found.questionIds] } : b;
    }));
    setErrors([]); setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleQuestion = (taskType: MockTaskType, qid: string, limit: number) => {
    setSections(prev => prev.map(s => {
      if (s.taskType !== taskType) return s;
      const has = s.questionIds.includes(qid);
      if (has) return { ...s, questionIds: s.questionIds.filter(x => x !== qid) };
      if (s.questionIds.length >= limit) {
        toast({ variant: 'destructive', title: `Only ${limit} allowed here — remove one first.` });
        return s;
      }
      return { ...s, questionIds: [...s.questionIds, qid] };
    }));
  };

  const move = (taskType: MockTaskType, index: number, dir: -1 | 1) => {
    setSections(prev => prev.map(s => {
      if (s.taskType !== taskType) return s;
      const ids = [...s.questionIds];
      const j = index + dir;
      if (j < 0 || j >= ids.length) return s;
      [ids[index], ids[j]] = [ids[j], ids[index]];
      return { ...s, questionIds: ids };
    }));
  };

  const save = async (active: boolean) => {
    if (!title.trim()) { toast({ variant: 'destructive', title: 'Title is required' }); return; }
    setSaving(true); setErrors([]);
    try {
      const res = await authedFetch('/api/admin/mock-tests', {
        method: 'POST',
        body: JSON.stringify({ id: editId, title, description, active, sections }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.validationErrors) setErrors(d.validationErrors);
        toast({ variant: 'destructive', title: d.error || 'Save failed' });
        return;
      }
      toast({ title: active ? 'Mock published' : 'Draft saved' });
      setEditing(false);
      await loadMocks();
    } finally { setSaving(false); }
  };

  const remove = async (m: MockTest) => {
    if (!window.confirm(`Delete "${m.title}"? Student attempts are kept.`)) return;
    const res = await authedFetch(`/api/admin/mock-tests?id=${m.id}`, { method: 'DELETE' });
    if (res.ok) { toast({ title: 'Mock deleted' }); await loadMocks(); }
    else toast({ variant: 'destructive', title: 'Delete failed' });
  };

  const totalPicked = sections.reduce((n, s) => n + s.questionIds.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={16} /> Back to Admin
        </Link>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-violet-600" /> Writing Mock Tests
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Build a {MOCK_TOTAL_QUESTIONS}-question mock ({formatDuration(MOCK_TOTAL_SECONDS)}) from the question bank.
        </p>
      </div>

      {!editing && (
        <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm">
          <Plus size={16} /> New Mock Test
        </button>
      )}

      {/* ── EDITOR ── */}
      {editing && (
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-violet-700">
              {editId ? 'Edit Mock' : 'New Mock'} — {totalPicked}/{MOCK_TOTAL_QUESTIONS} questions selected
            </h2>
            <button onClick={() => setEditing(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              <X size={13} /> Close
            </button>
          </div>

          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Mock title, e.g. Writing Mock Test 1"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
          <input
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />

          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-black uppercase text-red-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} /> Fix these before publishing
              </p>
              <ul className="space-y-1">
                {errors.map((e, i) => <li key={i} className="text-sm text-red-700">• {e}</li>)}
              </ul>
            </div>
          )}

          {/* Slots */}
          {MOCK_BLUEPRINT.map(spec => {
            const section = sections.find(s => s.taskType === spec.taskType)!;
            const options = bank[spec.taskType] ?? [];
            const complete = section.questionIds.length === spec.count;
            const needsAudio = spec.taskType === 'summarize-spoken-text' || spec.taskType === 'write-from-dictation';

            return (
              <div key={spec.taskType} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                      {spec.label}
                      {complete
                        ? <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"><Check size={10} /> {spec.count}/{spec.count}</span>
                        : <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{section.questionIds.length}/{spec.count}</span>}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {spec.secondsPerQuestion / 60} min each · {spec.realSection} section
                    </p>
                  </div>
                </div>

                {/* Chosen, in order */}
                {section.questionIds.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {section.questionIds.map((qid, idx) => {
                      const q = options.find(o => o.id === qid);
                      return (
                        <div key={qid} className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2">
                          <span className="text-[10px] font-black text-violet-600 w-5">{idx + 1}.</span>
                          <span className="flex-1 text-xs font-bold text-slate-700 truncate">
                            {q?.title ?? <span className="text-red-600">Missing question ({qid.slice(0, 6)}…)</span>}
                          </span>
                          {needsAudio && q && !q.audioUrl && (
                            <span className="text-[9px] font-black uppercase text-red-600 inline-flex items-center gap-1"><AlertTriangle size={10} /> no audio</span>
                          )}
                          <button onClick={() => move(spec.taskType, idx, -1)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp size={13} /></button>
                          <button onClick={() => move(spec.taskType, idx, 1)} disabled={idx === section.questionIds.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown size={13} /></button>
                          <button onClick={() => toggleQuestion(spec.taskType, qid, spec.count)} className="p-1 text-red-500 hover:text-red-700"><X size={13} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Picker */}
                {bankLoading ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><Loader2 className="animate-spin" size={12} /> Loading question bank…</p>
                ) : options.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No {spec.label} questions yet — add them in the{' '}
                    <Link href="/admin/dashboard/question-bank" className="text-violet-600 font-bold underline">Question Bank</Link>.
                  </p>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {options.map(q => {
                      const picked = section.questionIds.includes(q.id!);
                      const missingAudio = needsAudio && !q.audioUrl;
                      return (
                        <button
                          key={q.id}
                          onClick={() => toggleQuestion(spec.taskType, q.id!, spec.count)}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors ${
                            picked ? 'bg-violet-100 border-violet-300' : 'bg-white border-slate-200 hover:border-violet-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${picked ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                            {picked && <Check size={11} className="text-white" />}
                          </span>
                          <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{q.title}</span>
                          {q.audioUrl && <Music size={11} className="text-emerald-500 shrink-0" />}
                          {missingAudio && <span className="text-[9px] font-black uppercase text-red-600 shrink-0">no audio</span>}
                          {!q.active && <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">hidden</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Publish
            </button>
            <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-extrabold text-sm disabled:opacity-50">
              Save as draft
            </button>
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">
          All Mocks <span className="text-slate-400">({mocks.length})</span>
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="animate-spin" size={16} /> Loading…</div>
        ) : mocks.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No mock tests yet. Create the first one above.</p>
        ) : (
          <div className="space-y-3">
            {mocks.map(m => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-slate-800 truncate">{m.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${m.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {m.active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 mb-1">{m.description}</p>}
                  <p className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>{m.sections?.reduce((n, s) => n + s.questionIds.length, 0) ?? 0}/{MOCK_TOTAL_QUESTIONS} questions</span>
                    <span className="inline-flex items-center gap-1"><Users size={11} /> {attemptCounts[m.id!] ?? 0} attempts</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => startEdit(m)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Pencil size={14} /></button>
                  <button onClick={() => remove(m)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
