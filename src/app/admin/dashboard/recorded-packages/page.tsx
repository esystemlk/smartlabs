'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseBunnyRef } from '@/lib/bunny-parse';
import {
  listPackages, addPackage, updatePackage, deletePackage,
  listClasses, addClass, updateClass, deleteClass,
} from '@/lib/services/recorded-packages.service';
import { type RecordedPackage, type RecordedClass, formatLkr } from '@/types/recorded-package';
import {
  ArrowLeft, Plus, Pencil, Trash2, Loader2, X, Film, PlayCircle,
  Eye, EyeOff, ListVideo, GripVertical,
} from 'lucide-react';

const emptyPkg = (): Omit<RecordedPackage, 'id'> => ({
  title: '', periodLabel: '', description: '', features: [], price: 5000, accessMonths: 2,
  thumbnail: '', published: true, order: Date.now(),
});

export default function AdminRecordedPackagesPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [packages, setPackages] = useState<RecordedPackage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showPkg, setShowPkg] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<RecordedPackage, 'id'>>(emptyPkg());
  const [saving, setSaving] = useState(false);

  const [managePkg, setManagePkg] = useState<RecordedPackage | null>(null);

  // ── Access guard ──
  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !firestore) { router.push('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then(snap => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else router.push('/dashboard');
      setChecking(false);
    });
  }, [user, isUserLoading, firestore, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await listPackages(false);
      setPackages(pkgs);
      const c: Record<string, number> = {};
      await Promise.all(pkgs.map(async p => { if (p.id) c[p.id] = (await listClasses(p.id)).length; }));
      setCounts(c);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const openAdd = () => { setForm(emptyPkg()); setEditingId(null); setShowPkg(true); };
  const openEdit = (p: RecordedPackage) => {
    setForm({ ...emptyPkg(), ...p, features: p.features ?? [] });
    setEditingId(p.id!); setShowPkg(true);
  };

  const savePkg = async () => {
    if (form.title.trim().length < 2) { toast({ variant: 'destructive', title: 'Title is required.' }); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        periodLabel: form.periodLabel?.trim() ?? '',
        description: form.description?.trim() ?? '',
        features: (form.features ?? []).map(f => f.trim()).filter(Boolean),
        price: Number(form.price) || 0,
        accessMonths: Number(form.accessMonths) || 1,
        thumbnail: form.thumbnail?.trim() ?? '',
        published: form.published,
        order: Number(form.order) || Date.now(),
      };
      if (editingId) { await updatePackage(editingId, payload); toast({ title: 'Package updated' }); }
      else { await addPackage(payload); toast({ title: 'Package created' }); }
      setShowPkg(false); setEditingId(null);
      await load();
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Save failed' }); }
    finally { setSaving(false); }
  };

  const removePkg = async (p: RecordedPackage) => {
    if (!confirm(`Delete "${p.title}" and all its classes? This cannot be undone.`)) return;
    try { await deletePackage(p.id!); toast({ title: 'Package deleted' }); await load(); }
    catch { toast({ variant: 'destructive', title: 'Delete failed' }); }
  };

  if (checking || isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/dashboard"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span></Button></Link>
            <div className="flex items-center gap-2 min-w-0">
              <Film className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-base font-semibold truncate">Recorded Packages</h1>
            </div>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Package</span></Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Build a monthly package, then add the class videos from Bunny. Students see published packages under{' '}
          <Link href="/dashboard/recorded-sessions" className="text-primary underline">Recorded Sessions</Link>.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : packages.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No packages yet.</p>
            <Button className="mt-4 gap-1.5" onClick={openAdd}><Plus className="h-4 w-4" /> Create your first package</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(p => (
              <div key={p.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.periodLabel && <Badge variant="secondary">{p.periodLabel}</Badge>}
                      <Badge className={p.published ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-500'}>{p.published ? 'Published' : 'Hidden'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {counts[p.id!] ?? 0} classes</span>
                  <span>{p.accessMonths} mo access</span>
                  <span className="font-semibold text-foreground">{formatLkr(p.price)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setManagePkg(p)}><ListVideo className="h-3.5 w-3.5" /> Classes</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removePkg(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package modal */}
      {showPkg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setShowPkg(false)}>
          <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Package' : 'New Package'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPkg(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <Field label="Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. January 2026 — PTE Recorded Classes" className="rp-input" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Period label"><input value={form.periodLabel} onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))} placeholder="January 2026" className="rp-input" /></Field>
                <Field label="Status">
                  <select value={form.published ? '1' : '0'} onChange={e => setForm(f => ({ ...f, published: e.target.value === '1' }))} className="rp-input">
                    <option value="1">Published</option>
                    <option value="0">Hidden</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (LKR)"><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} className="rp-input" /></Field>
                <Field label="Access (months)"><input type="number" value={form.accessMonths} onChange={e => setForm(f => ({ ...f, accessMonths: parseInt(e.target.value) || 1 }))} className="rp-input" /></Field>
              </div>
              <Field label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="rp-input" /></Field>
              <Field label="Features (one per line)">
                <textarea value={(form.features ?? []).join('\n')} onChange={e => setForm(f => ({ ...f, features: e.target.value.split('\n') }))} rows={3} placeholder={'Full-length real class recordings\nWatch on any device\n2 months access'} className="rp-input" />
              </Field>
              <Field label="Cover image URL (optional — else first class thumbnail)"><input value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} placeholder="https://…" className="rp-input" /></Field>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPkg(false)}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={savePkg} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingId ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Class manager */}
      {managePkg && <ClassManager pkg={managePkg} onClose={() => { setManagePkg(null); load(); }} />}

      <style jsx global>{`
        .rp-input {
          width: 100%; border-radius: 0.6rem; border: 1px solid hsl(var(--border));
          background: hsl(var(--background)); padding: 0.55rem 0.75rem; font-size: 0.875rem; outline: none;
        }
        .rp-input:focus { border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>{children}</div>;
}

// ─── Class manager modal ─────────────────────────────────────────────────────
function ClassManager({ pkg, onClose }: { pkg: RecordedPackage; onClose: () => void }) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<RecordedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [duration, setDuration] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setClasses(await listClasses(pkg.id!)); } finally { setLoading(false); }
  }, [pkg.id]);
  useEffect(() => { load(); }, [load]);

  const addOne = async () => {
    if (title.trim().length < 2) { toast({ variant: 'destructive', title: 'Class title is required.' }); return; }
    const ref = parseBunnyRef(link);
    if (!ref) { toast({ variant: 'destructive', title: 'Could not read a Bunny library/video id from the link.' }); return; }
    setAdding(true);
    try {
      await addClass({
        packageId: pkg.id!, title: title.trim(), bunnyLibraryId: ref.libraryId, bunnyVideoId: ref.videoId,
        duration: duration.trim(), order: classes.length, published: true,
      });
      setTitle(''); setLink(''); setDuration('');
      await load();
      toast({ title: 'Class added' });
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Add failed' }); }
    finally { setAdding(false); }
  };

  const importBulk = async () => {
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean);
    let ok = 0, bad = 0;
    for (const [i, line] of lines.entries()) {
      const [t, l, d] = line.split('|').map(s => s.trim());
      const ref = parseBunnyRef(l ?? '');
      if (!t || !ref) { bad++; continue; }
      // eslint-disable-next-line no-await-in-loop
      await addClass({ packageId: pkg.id!, title: t, bunnyLibraryId: ref.libraryId, bunnyVideoId: ref.videoId, duration: d ?? '', order: classes.length + i, published: true });
      ok++;
    }
    setBulk(''); setShowBulk(false); await load();
    toast({ title: `Imported ${ok} class${ok === 1 ? '' : 'es'}`, description: bad ? `${bad} line(s) skipped` : undefined });
  };

  const togglePub = async (c: RecordedClass) => { await updateClass(c.id!, { published: !c.published }); await load(); };
  const remove = async (c: RecordedClass) => { if (!confirm(`Delete "${c.title}"?`)) return; await deleteClass(c.id!); await load(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card p-5 sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">Classes — {pkg.title}</h2>
            <p className="text-xs text-muted-foreground">{classes.length} class{classes.length === 1 ? '' : 'es'}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Add form */}
        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Class title, e.g. Class 1 — Reading Strategies" className="rp-input" />
            <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="1h 45m" className="rp-input" />
          </div>
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="Bunny link or 12345/video-guid" className="rp-input" />
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setShowBulk(v => !v)} className="text-xs text-primary underline">{showBulk ? 'Hide bulk import' : 'Bulk import'}</button>
            <Button size="sm" onClick={addOne} disabled={adding} className="gap-1.5">{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add class</Button>
          </div>
          {showBulk && (
            <div className="pt-1">
              <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={4}
                placeholder={'One per line:  Title | Bunny link | duration(optional)\nClass 1 | https://iframe.mediadelivery.net/embed/12345/guid | 1h 40m'}
                className="rp-input font-mono text-xs" />
              <div className="mt-2 flex justify-end"><Button size="sm" variant="secondary" onClick={importBulk}>Import lines</Button></div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : classes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No classes yet. Add the batch's videos above.</p>
          ) : classes.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${c.published ? '' : 'text-muted-foreground line-through'}`}>{c.title}</p>
                <p className="truncate text-[11px] text-muted-foreground font-mono">{c.bunnyLibraryId}/{c.bunnyVideoId}{c.duration ? ` · ${c.duration}` : ''}</p>
              </div>
              <button onClick={() => togglePub(c)} title={c.published ? 'Hide' : 'Publish'} className="text-muted-foreground hover:text-foreground shrink-0">
                {c.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(c)} className="text-red-600 hover:text-red-700 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
