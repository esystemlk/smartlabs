'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, PlayCircle, Plus, Pencil, Trash2, Loader2, X, Upload,
  CheckCircle2, AlertTriangle, Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  listRecordings, addRecording, updateRecording, deleteRecording,
} from '@/lib/services/recordings.service';
import { parseBunnyRef, parseBulk, type BulkRow } from '@/lib/bunny-parse';
import { type ClassRecording, RECORDING_PRICE, priceBreakdown, monthLabel } from '@/types/recording';

const EMPTY = {
  title: '', description: '', classDate: '', classNumber: 1 as 1 | 2,
  link: '', duration: '', price: RECORDING_PRICE,
};

export default function AdminRecordingsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const [bulkText, setBulkText] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await listRecordings()); }
    catch (e) { toast({ variant: 'destructive', title: 'Failed to load recordings', description: String(e) }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const reset = () => { setForm({ ...EMPTY }); setEditingId(null); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ variant: 'destructive', title: 'Title is required' }); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.classDate)) { toast({ variant: 'destructive', title: 'Class date must be YYYY-MM-DD' }); return; }
    const ref = parseBunnyRef(form.link);
    if (!ref) { toast({ variant: 'destructive', title: 'Could not read the Bunny link', description: 'Paste the embed URL or "libraryId/videoId".' }); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        month: form.classDate.slice(0, 7),
        classNumber: form.classNumber,
        classDate: form.classDate,
        bunnyLibraryId: ref.libraryId,
        bunnyVideoId: ref.videoId,
        duration: form.duration.trim() || undefined,
        price: Number(form.price) || RECORDING_PRICE,
        published: true,
      };
      if (editingId) {
        await updateRecording(editingId, payload);
        toast({ title: 'Recording updated' });
      } else {
        await addRecording(payload);
        toast({ title: 'Recording added' });
      }
      reset();
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: String(e) });
    } finally { setSaving(false); }
  };

  const handleEdit = (r: ClassRecording) => {
    setMode('single');
    setEditingId(r.id ?? null);
    setForm({
      title: r.title,
      description: r.description ?? '',
      classDate: r.classDate,
      classNumber: r.classNumber,
      link: `${r.bunnyLibraryId}/${r.bunnyVideoId}`,
      duration: r.duration ?? '',
      price: r.price ?? RECORDING_PRICE,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (r: ClassRecording) => {
    if (!r.id) return;
    if (!window.confirm(`Delete "${r.title}"? Students who purchased it will lose access. This cannot be undone.`)) return;
    try { await deleteRecording(r.id); toast({ title: 'Recording deleted' }); await load(); }
    catch (e) { toast({ variant: 'destructive', title: 'Delete failed', description: String(e) }); }
  };

  const togglePublish = async (r: ClassRecording) => {
    if (!r.id) return;
    try { await updateRecording(r.id, { published: !r.published }); await load(); }
    catch (e) { toast({ variant: 'destructive', title: 'Update failed', description: String(e) }); }
  };

  const runBulkParse = (text: string) => { setBulkText(text); setBulkRows(parseBulk(text)); };

  const handleBulkImport = async () => {
    const good = bulkRows.filter(r => r.ok);
    if (good.length === 0) { toast({ variant: 'destructive', title: 'Nothing valid to import' }); return; }
    setBulkSaving(true);
    let added = 0;
    try {
      for (const r of good) {
        await addRecording({
          title: r.title!,
          month: r.month!,
          classNumber: r.classNumber!,
          classDate: r.classDate!,
          bunnyLibraryId: r.libraryId!,
          bunnyVideoId: r.videoId!,
          price: RECORDING_PRICE,
          published: true,
        });
        added++;
      }
      toast({ title: `Imported ${added} recording${added === 1 ? '' : 's'}` });
      setBulkText(''); setBulkRows([]);
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: `Import stopped after ${added}`, description: String(e) });
      await load();
    } finally { setBulkSaving(false); }
  };

  const validCount = bulkRows.filter(r => r.ok).length;
  const badCount = bulkRows.length - validCount;
  const { total } = priceBreakdown(Number(form.price) || RECORDING_PRICE);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={16} /> Back to Admin
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <PlayCircle className="h-7 w-7 text-violet-600" /> Class Recordings
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Each recording is one class, sold separately. Students get 30 days of access.
            </p>
          </div>
          <Link
            href="/admin/dashboard/recordings/students"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm"
          >
            <Users size={15} /> Student Access
          </Link>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['single', 'bulk'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m === 'bulk') reset(); }}
            className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${
              mode === m ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
            }`}
          >
            {m === 'single' ? 'Add Single' : 'Bulk Upload'}
          </button>
        ))}
      </div>

      {/* ── SINGLE ── */}
      {mode === 'single' && (
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-violet-700">
              {editingId ? 'Edit Recording' : 'Add Recording'}
            </h2>
            {editingId && (
              <button onClick={reset} className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                <X size={13} /> Cancel edit
              </button>
            )}
          </div>

          <Field label="Title">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="PTE Class 14 — Reading Strategies" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Class date">
              <input type="date" value={form.classDate} onChange={e => setForm({ ...form, classDate: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Which class this month">
              <select value={form.classNumber} onChange={e => setForm({ ...form, classNumber: Number(e.target.value) as 1 | 2 })} className={inputCls}>
                <option value={1}>Class 1</option>
                <option value={2}>Class 2</option>
              </select>
            </Field>
            <Field label="Duration (optional)">
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="1h 45m" className={inputCls} />
            </Field>
          </div>

          <Field label="Bunny Stream link">
            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
              placeholder="https://iframe.mediadelivery.net/embed/12345/abcd-guid  (or 12345/abcd-guid)" className={inputCls} />
          </Field>
          {form.link && !parseBunnyRef(form.link) && (
            <p className="text-xs text-red-600 font-semibold -mt-2 mb-2">Can&apos;t read a library/video id from that link.</p>
          )}
          {form.link && parseBunnyRef(form.link) && (
            <p className="text-xs text-emerald-600 font-semibold -mt-2 mb-2 inline-flex items-center gap-1">
              <CheckCircle2 size={13} /> Library {parseBunnyRef(form.link)!.libraryId} · Video {parseBunnyRef(form.link)!.videoId.slice(0, 12)}…
            </p>
          )}

          <Field label="Description (optional)">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="What this class covered…" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <Field label="Price (LKR, before fee)">
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} />
            </Field>
            <p className="text-xs text-slate-500 pb-3">
              Student pays <span className="font-black text-slate-800">LKR {total.toLocaleString()}</span> (incl. 2.99% fee)
            </p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {editingId ? 'Update Recording' : 'Add Recording'}
          </button>
        </div>
      )}

      {/* ── BULK ── */}
      {mode === 'bulk' && (
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-violet-700 mb-2">Bulk Upload</h2>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            One recording per line: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">Title | YYYY-MM-DD | 1 or 2 | Bunny link</code>
            <br />Month is taken from the date. Lines starting with <code className="font-mono">#</code> are ignored.
          </p>
          <textarea
            value={bulkText}
            onChange={e => runBulkParse(e.target.value)}
            rows={7}
            placeholder={`PTE Class 13 — Listening | 2026-01-06 | 1 | https://iframe.mediadelivery.net/embed/12345/aaaa-guid\nPTE Class 14 — Reading | 2026-01-20 | 2 | 12345/bbbb-guid`}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />

          {bulkRows.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-3 text-xs font-black mb-2">
                <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={13} /> {validCount} ready</span>
                {badCount > 0 && <span className="text-red-600 inline-flex items-center gap-1"><AlertTriangle size={13} /> {badCount} with errors</span>}
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {bulkRows.map(r => (
                  <div key={r.line} className={`text-[11px] rounded-lg px-3 py-2 border ${r.ok ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="font-mono text-slate-400 mr-2">L{r.line}</span>
                    {r.ok ? (
                      <span className="text-slate-700">
                        <span className="font-bold">{r.title}</span> · {monthLabel(r.month!)} Class {r.classNumber} · lib {r.libraryId}
                      </span>
                    ) : (
                      <span className="text-red-700">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleBulkImport} disabled={bulkSaving || validCount === 0}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm disabled:opacity-50">
            {bulkSaving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            Import {validCount > 0 ? `${validCount} recording${validCount === 1 ? '' : 's'}` : ''}
          </button>
        </div>
      )}

      {/* ── LIST ── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">
          All Recordings <span className="text-slate-400">({items.length})</span>
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="animate-spin" size={16} /> Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No recordings yet. Add the first one above.</p>
        ) : (
          <div className="space-y-3">
            {items.map(r => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-sm text-slate-800 truncate">{r.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                      {monthLabel(r.month)} · Class {r.classNumber}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${r.published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {r.published ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {r.classDate}{r.duration ? ` · ${r.duration}` : ''} · LKR {(r.price ?? RECORDING_PRICE).toLocaleString()} · lib {r.bunnyLibraryId}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublish(r)} className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    {r.published ? 'Hide' : 'Publish'}
                  </button>
                  <button onClick={() => handleEdit(r)} aria-label="Edit" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(r)} aria-label="Delete" className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
