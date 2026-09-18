'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { bulkAddQuestions } from '@/lib/services/pte-questions-bulk';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Loader2, ImagePlus, Plus, X, CheckCircle2 } from 'lucide-react';

interface DraftImage { imageUrl: string; title: string; describe: string }

const safeName = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_');

export default function DescribeImageAdminPage() {
  const { storage } = useFirebase();
  const { toast } = useToast();

  // Single
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [describe, setDescribe] = useState('');
  const [category, setCategory] = useState('');
  const [prediction, setPrediction] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const singleRef = useRef<HTMLInputElement>(null);

  // Bulk
  const [drafts, setDrafts] = useState<DraftImage[]>([]);
  const [bulkPrediction, setBulkPrediction] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const bulkRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File): Promise<string | null> => {
    if (!storage) { toast({ variant: 'destructive', title: 'Storage not ready' }); return null; }
    if (!file.type.startsWith('image/')) { toast({ variant: 'destructive', title: 'Please choose an image (PNG/JPG).' }); return null; }
    if (file.size > 8 * 1024 * 1024) { toast({ variant: 'destructive', title: 'Image must be under 8 MB.' }); return null; }
    const sRef = ref(storage, `describe-image/${Date.now()}-${safeName(file.name)}`);
    await uploadBytes(sRef, file);
    return getDownloadURL(sRef);
  };

  /* ── Single ── */
  const onSingleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadOne(file);
      if (url) { setImageUrl(url); if (!title) setTitle(file.name.replace(/\.[^.]+$/, '')); toast({ title: 'Image uploaded' }); }
    } catch (e) { toast({ variant: 'destructive', title: 'Upload failed', description: String(e) }); }
    finally { setUploading(false); if (singleRef.current) singleRef.current.value = ''; }
  };

  const saveSingle = async () => {
    if (!imageUrl) { toast({ variant: 'destructive', title: 'Upload an image first' }); return; }
    setSaving(true);
    try {
      const item = { id: `di-${Date.now()}`, title: title.trim() || 'Describe Image', imageUrl, describe: describe.trim(), category: category.trim() || null };
      const res = await bulkAddQuestions('speaking', 'describe-image', [item], { isPrediction: prediction });
      if (res.success) {
        toast({ title: prediction ? 'Prediction question added' : 'Question added' });
        setImageUrl(''); setTitle(''); setDescribe(''); setCategory(''); setPrediction(false);
      } else {
        toast({ variant: 'destructive', title: 'Save failed', description: res.firstError });
      }
    } catch (e) { toast({ variant: 'destructive', title: 'Save failed', description: String(e) }); }
    finally { setSaving(false); }
  };

  /* ── Bulk ── */
  const onBulkFiles = async (files: FileList) => {
    setBulkUploading(true);
    try {
      const next: DraftImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadOne(file);
        if (url) next.push({ imageUrl: url, title: file.name.replace(/\.[^.]+$/, ''), describe: '' });
      }
      setDrafts((d) => [...d, ...next]);
      if (next.length) toast({ title: `Uploaded ${next.length} image${next.length === 1 ? '' : 's'}` });
    } catch (e) { toast({ variant: 'destructive', title: 'Upload failed', description: String(e) }); }
    finally { setBulkUploading(false); if (bulkRef.current) bulkRef.current.value = ''; }
  };

  const saveBulk = async () => {
    if (drafts.length === 0) return;
    setBulkSaving(true);
    try {
      const items = drafts.map((d, i) => ({ id: `di-${Date.now()}-${i}`, title: d.title.trim() || 'Describe Image', imageUrl: d.imageUrl, describe: d.describe.trim() }));
      const res = await bulkAddQuestions('speaking', 'describe-image', items, { isPrediction: bulkPrediction });
      toast({ title: `Added ${res.added} question${res.added === 1 ? '' : 's'}${res.failed ? `, ${res.failed} failed` : ''}` });
      if (res.success) { setDrafts([]); setBulkPrediction(false); }
    } catch (e) { toast({ variant: 'destructive', title: 'Save failed', description: String(e) }); }
    finally { setBulkSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/dashboard/question-bank" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Question bank
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Describe Image — questions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the image students describe. Add key facts the AI should look for, and mark exam
          predictions. Add one at a time, or many images at once.
        </p>
      </div>

      {/* Single upload */}
      <section className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-violet-700 flex items-center gap-2"><ImagePlus size={15} /> Add one image</h2>

        <input ref={singleRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSingleFile(f); }} />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Question" className="max-h-64 w-auto rounded-xl border bg-white p-2" />
        ) : null}
        <button type="button" onClick={() => singleRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-200 bg-white px-4 py-2.5 text-sm font-extrabold text-violet-700 hover:border-violet-400 disabled:opacity-50">
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} {imageUrl ? 'Replace image' : 'Upload image (PNG/JPG)'}
        </button>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / label (optional)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
        <div>
          <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">Key facts to describe (AI reference)</label>
          <textarea value={describe} onChange={(e) => setDescribe(e.target.value)} rows={4}
            placeholder="e.g. Bar chart comparing coffee consumption across 4 countries; Brazil highest at 60%, Japan lowest at 20%; overall downward trend…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="flex-1 min-w-[160px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={prediction} onChange={(e) => setPrediction(e.target.checked)} className="h-4 w-4" />
            Mark as prediction
          </label>
        </div>
        <button onClick={saveSingle} disabled={saving || uploading || !imageUrl}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-violet-700 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Add question
        </button>
      </section>

      {/* Bulk upload */}
      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2"><Upload size={15} /> Bulk upload images</h2>
        <p className="text-sm text-muted-foreground">Select several images at once — each becomes a question. Add the key facts per image below, then save all.</p>

        <input ref={bulkRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = e.target.files; if (f && f.length) onBulkFiles(f); }} />
        <button type="button" onClick={() => bulkRef.current?.click()} disabled={bulkUploading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:border-slate-400 disabled:opacity-50">
          {bulkUploading ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Choose images
        </button>

        {drafts.length > 0 && (
          <>
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <div key={i} className="flex gap-3 rounded-xl border bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg border object-contain bg-white" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input value={d.title} onChange={(e) => setDrafts((a) => a.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      placeholder="Title" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                    <textarea value={d.describe} onChange={(e) => setDrafts((a) => a.map((x, j) => j === i ? { ...x, describe: e.target.value } : x))}
                      rows={2} placeholder="Key facts to describe (AI reference)…" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <button onClick={() => setDrafts((a) => a.filter((_, j) => j !== i))} className="h-7 w-7 shrink-0 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={bulkPrediction} onChange={(e) => setBulkPrediction(e.target.checked)} className="h-4 w-4" />
                Mark all as predictions
              </label>
              <button onClick={saveBulk} disabled={bulkSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-violet-700 disabled:opacity-50">
                {bulkSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Add {drafts.length} question{drafts.length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
