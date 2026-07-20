'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PTE_TASK_TREE } from '@/lib/pte-tasks';
import type { PteSection, PteQuestion } from '@/types/pte-question';
import { addQuestion, updateQuestion, deleteQuestion, listQuestions } from '@/lib/services/pte-questions.service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Lock, Loader2, ListChecks, X, Upload, Music, CheckCircle2 } from 'lucide-react';

export default function QuestionBankPage() {
  const { toast } = useToast();
  const { storage } = useFirebase();
  const [section, setSection] = useState<PteSection>('writing');
  const [taskType, setTaskType] = useState<string>('write-essay');
  const [questions, setQuestions] = useState<PteQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentSection = PTE_TASK_TREE.find(s => s.section === section)!;
  const currentTask = currentSection.tasks.find(t => t.taskType === taskType);
  const isSwt = taskType === 'swt';
  const isSst = taskType === 'summarize-spoken-text';
  const isWfd = taskType === 'write-from-dictation';
  /** Any task where the student listens to audio and the text is the answer key. */
  const hasAudio = isSst || isWfd;
  const contentLabel = isWfd
    ? 'Official Transcript (the exact sentence)'
    : isSst ? 'Lecture Transcript' : isSwt ? 'Source Passage' : 'Essay Topic / Prompt';

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

  const resetForm = () => { setTitle(''); setContent(''); setAudioUrl(''); setEditingId(null); if (audioInputRef.current) audioInputRef.current.value = ''; };

  const handleAudioUpload = async (file: File) => {
    if (!storage) { toast({ variant: 'destructive', title: 'Storage not ready' }); return; }
    if (!file.type.startsWith('audio/')) { toast({ variant: 'destructive', title: 'Please choose an audio file (MP3).' }); return; }
    if (file.size > 20 * 1024 * 1024) { toast({ variant: 'destructive', title: 'Audio must be under 20 MB.' }); return; }
    setUploadingAudio(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const sRef = ref(storage, `sst-audio/${Date.now()}-${taskType}-${safeName}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setAudioUrl(url);
      toast({ title: 'Audio uploaded' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Audio upload failed', description: String(e) });
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) { toast({ variant: 'destructive', title: contentLabel + ' is required' }); return; }
    setSaving(true);
    try {
      const extra = hasAudio ? { audioUrl: audioUrl.trim() } : {};
      if (editingId) {
        await updateQuestion(editingId, { title: title.trim() || untitled(), content: content.trim(), ...extra });
        toast({ title: 'Question updated' });
      } else {
        await addQuestion({ section, taskType, title: title.trim() || untitled(), content: content.trim(), active: true, ...extra });
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
    setAudioUrl(q.audioUrl ?? '');
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
          Manage practice questions for each PTE part. Writing and Listening → Summarize Spoken Text are active — the rest unlock as we rebuild them.
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
          rows={isWfd ? 3 : (isSwt || isSst) ? 7 : 3}
          placeholder={
            isWfd ? 'Type the sentence exactly as spoken in the audio — this is the answer key every word is scored against…'
            : isSst ? 'Paste the lecture transcript (used as the reference for AI scoring; students only hear the audio)…'
            : isSwt ? 'Paste the full source passage students will summarise…'
            : 'Enter the essay topic / prompt…'
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />

        {/* ── SST: lecture audio upload ── */}
        {hasAudio && (
          <div className="mt-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Lecture Audio (MP3)</label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={uploadingAudio}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-violet-200 hover:border-violet-400 text-violet-700 font-extrabold text-sm disabled:opacity-50"
              >
                {uploadingAudio ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {audioUrl ? 'Replace Audio' : 'Upload MP3'}
              </button>
              {audioUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                  <CheckCircle2 size={15} /> Audio attached
                </span>
              )}
            </div>
            {audioUrl && (
              <audio controls src={audioUrl} className="mt-3 w-full max-w-md h-10">
                Your browser does not support audio playback.
              </audio>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Optional — if left empty, the trainer reads the transcript aloud with an AI voice. Max 20 MB.
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || uploadingAudio}
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
                    {hasAudio && (
                      q.audioUrl
                        ? <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200"><Music size={10} /> Audio</span>
                        : <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">AI Voice</span>
                    )}
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
