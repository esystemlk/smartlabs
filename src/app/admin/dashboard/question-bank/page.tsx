'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PTE_TASK_TREE } from '@/lib/pte-tasks';
import type { PteSection, PteQuestion } from '@/types/pte-question';
import { addQuestion, updateQuestion, deleteQuestion, listQuestions } from '@/lib/services/pte-questions.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Lock, Loader2, ListChecks, X } from 'lucide-react';

export default function QuestionBankPage() {
  const { toast } = useToast();
  const [section, setSection] = useState<PteSection>('writing');
  const [taskType, setTaskType] = useState<string>('write-essay');
  const [questions, setQuestions] = useState<PteQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentSection = PTE_TASK_TREE.find(s => s.section === section)!;
  const currentTask = currentSection.tasks.find(t => t.taskType === taskType);
  const isSwt = taskType === 'swt';
  const contentLabel = isSwt ? 'Source Passage' : 'Essay Topic / Prompt';

  const load = async () => {
    setLoading(true);
    try {
      setQuestions(await listQuestions(section, taskType));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to load questions', description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); resetForm(); /* eslint-disable-next-line */ }, [section, taskType]);

  const resetForm = () => { setTitle(''); setContent(''); setEditingId(null); };

  const handleSave = async () => {
    if (!content.trim()) { toast({ variant: 'destructive', title: contentLabel + ' is required' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateQuestion(editingId, { title: title.trim() || untitled(), content: content.trim() });
        toast({ title: 'Question updated' });
      } else {
        await addQuestion({ section, taskType, title: title.trim() || untitled(), content: content.trim(), active: true });
        toast({ title: 'Question added' });
      }
      resetForm();
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const untitled = () => `${currentTask?.label ?? 'Question'} ${questions.length + 1}`;

  const handleEdit = (q: PteQuestion) => {
    setEditingId(q.id ?? null);
    setTitle(q.title);
    setContent(q.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (q: PteQuestion) => {
    if (!q.id) return;
    if (!window.confirm(`Delete "${q.title}"? This cannot be undone.`)) return;
    try {
      await deleteQuestion(q.id);
      toast({ title: 'Question deleted' });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: String(e) });
    }
  };

  const handleToggle = async (q: PteQuestion) => {
    if (!q.id) return;
    try {
      await updateQuestion(q.id, { active: !q.active });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed', description: String(e) });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={16} /> Back to Admin
        </Link>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-violet-600" /> PTE Question Bank
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Manage practice questions for each PTE part. Only Writing is active for now — the rest unlock as we rebuild them.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {PTE_TASK_TREE.map(s => {
          const active = s.section === section;
          return (
            <button
              key={s.section}
              disabled={!s.enabled}
              onClick={() => { if (s.enabled) { setSection(s.section); setTaskType(s.tasks[0].taskType); } }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all border-2 ${
                active ? 'bg-violet-600 text-white border-violet-600'
                : s.enabled ? 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              {!s.enabled && <Lock size={13} />}{s.label}
            </button>
          );
        })}
      </div>

      {/* Task sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {currentSection.tasks.map(t => {
          const active = t.taskType === taskType;
          return (
            <button
              key={t.taskType}
              disabled={!t.enabled}
              onClick={() => t.enabled && setTaskType(t.taskType)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all border ${
                active ? 'bg-violet-100 text-violet-700 border-violet-300'
                : t.enabled ? 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              {!t.enabled && <Lock size={11} className="inline mr-1" />}{t.label}
            </button>
          );
        })}
      </div>

      {/* Add / Edit form */}
      <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-violet-700">
            {editingId ? 'Edit Question' : `Add ${currentTask?.label ?? ''} Question`}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              <X size={13} /> Cancel edit
            </button>
          )}
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title / label (optional)"
          className="w-full mb-3 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">{contentLabel}</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={isSwt ? 7 : 3}
          placeholder={isSwt ? 'Paste the full source passage students will summarise…' : 'Enter the essay topic / prompt…'}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          {editingId ? 'Update Question' : 'Add Question'}
        </button>
      </div>

      {/* Questions list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
            {currentTask?.label} Questions <span className="text-slate-400">({questions.length})</span>
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="animate-spin" size={16} /> Loading…</div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No questions yet. Add the first one above.</p>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-slate-800 truncate">{q.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${q.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {q.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{q.content}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleToggle(q)} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    {q.active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleEdit(q)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(q)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
