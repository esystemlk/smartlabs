'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, getDocs, where } from 'firebase/firestore';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PTE_PACKAGES, formatLkr } from '@/lib/pte-packages';
import { phoneKey } from '@/lib/utils';
import {
  ArrowLeft, Plus, Pencil, Trash2, Users, CalendarDays, MapPin, Clock,
  Loader2, X, GraduationCap, Eye, MessageCircle, CheckCircle2, XCircle, Search,
} from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  mode: 'online' | 'hybrid';
  location?: string;
  startDate?: string;
  schedule?: string;
  seats?: number;
  seatsFilled?: number;
  packageIds?: string[];
  status: 'open' | 'closed';
  note?: string;
  whatsappLink?: string;
}

interface Enrollment {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  packageName?: string;
  batchId?: string;
  batchName?: string;
  amountPaid?: number;
}

const emptyForm = (): Omit<Batch, 'id'> => ({
  name: '', mode: 'online', location: '', startDate: '', schedule: '',
  seats: 30, seatsFilled: 0, packageIds: PTE_PACKAGES.map(p => p.id), status: 'open', note: '', whatsappLink: '',
});

export default function AdminPteBatchesPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Batch, 'id'>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [viewEnrollBatch, setViewEnrollBatch] = useState<Batch | null>(null);

  // WhatsApp join-request verifier
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<Enrollment[] | null>(null);

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

  const batchesQuery = useMemoFirebase(
    () => (firestore && allowed ? query(collection(firestore, 'pte_batches'), orderBy('createdAt', 'desc')) : null),
    [firestore, allowed]
  );
  const { data: batchesRaw, isLoading } = useCollection(batchesQuery);
  const batches = useMemo<Batch[]>(() => (batchesRaw as Batch[] | undefined) ?? [], [batchesRaw]);

  const enrollQuery = useMemoFirebase(
    () => (firestore && viewEnrollBatch ? query(collection(firestore, 'pte_course_enrollments'), where('batchId', '==', viewEnrollBatch.id)) : null),
    [firestore, viewEnrollBatch]
  );
  const { data: enrollRaw } = useCollection(enrollQuery);
  const enrollments = (enrollRaw as Enrollment[] | undefined) ?? [];

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const openEdit = (b: Batch) => {
    setForm({ ...emptyForm(), ...b, packageIds: b.packageIds?.length ? b.packageIds : PTE_PACKAGES.map(p => p.id) });
    setEditingId(b.id); setShowForm(true);
  };

  const togglePkg = (id: string) => setForm(f => {
    const set = new Set(f.packageIds ?? []);
    set.has(id) ? set.delete(id) : set.add(id);
    return { ...f, packageIds: [...set] };
  });

  const save = async () => {
    if (!firestore) return;
    if (form.name.trim().length < 2) { toast({ variant: 'destructive', title: 'Batch name is required.' }); return; }
    if (!form.packageIds?.length) { toast({ variant: 'destructive', title: 'Select at least one package.' }); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        mode: form.mode,
        location: form.location?.trim() ?? '',
        startDate: form.startDate?.trim() ?? '',
        schedule: form.schedule?.trim() ?? '',
        seats: Number(form.seats) || 0,
        packageIds: form.packageIds,
        status: form.status,
        note: form.note?.trim() ?? '',
        whatsappLink: form.whatsappLink?.trim() ?? '',
      };
      if (editingId) {
        await updateDoc(doc(firestore, 'pte_batches', editingId), { ...payload, updatedAt: serverTimestamp() });
        toast({ title: 'Batch updated' });
      } else {
        await addDoc(collection(firestore, 'pte_batches'), { ...payload, seatsFilled: 0, createdAt: serverTimestamp() });
        toast({ title: 'Batch created' });
      }
      setShowForm(false); setEditingId(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Save failed', description: 'Check your permissions and try again.' });
    } finally { setSaving(false); }
  };

  const remove = async (b: Batch) => {
    if (!firestore) return;
    if (!confirm(`Delete batch "${b.name}"? This cannot be undone. (Existing enrollments are kept.)`)) return;
    try { await deleteDoc(doc(firestore, 'pte_batches', b.id)); toast({ title: 'Batch deleted' }); }
    catch { toast({ variant: 'destructive', title: 'Delete failed' }); }
  };

  const verify = async () => {
    if (!firestore) return;
    const key = phoneKey(verifyInput);
    if (key.length < 9) { toast({ variant: 'destructive', title: 'Enter a valid phone number.' }); return; }
    setVerifying(true); setVerifyResult(null);
    try {
      const snap = await getDocs(query(collection(firestore, 'pte_course_enrollments'), where('phoneKey', '==', key)));
      setVerifyResult(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) })));
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Lookup failed' });
    } finally { setVerifying(false); }
  };

  if (checking || isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Dashboard</Button></Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold">PTE Batch Manager</h1>
            </div>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="h-4 w-4" /> New Batch</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Create the batches students can join on the{' '}
          <Link href="/pte-registration" className="text-primary underline">PTE registration page</Link>.
          Only <b>open</b> batches appear to students; seats fill automatically as students pay.
        </p>

        {/* ── WhatsApp join-request verifier ── */}
        <div className="rounded-xl border bg-card p-5 mb-8 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10"><MessageCircle className="h-4 w-4 text-green-600" /></div>
            <div>
              <h2 className="text-sm font-semibold">Verify a WhatsApp join request</h2>
              <p className="text-xs text-muted-foreground">Set your group to “require admin approval to join”, then check each requester’s number here before approving.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={verifyInput}
              onChange={e => setVerifyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') verify(); }}
              placeholder="Paste the number, e.g. +94 77 123 4567"
              className="input flex-1"
            />
            <Button onClick={verify} disabled={verifying} className="gap-1.5">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Check
            </Button>
          </div>
          {verifyResult !== null && (
            verifyResult.length === 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span><b>No paid enrollment found</b> for this number — decline the join request.</span>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
                <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Paid — safe to approve</div>
                {verifyResult.map(r => (
                  <div key={r.id} className="mt-1.5 text-xs text-foreground/80">
                    {r.fullName || '—'} · {r.packageName || '—'} · {r.batchName || '—'} · {r.amountPaid ? formatLkr(r.amountPaid) : '—'}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading batches…</div>
        ) : batches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No batches yet.</p>
            <Button className="mt-4 gap-1.5" onClick={openAdd}><Plus className="h-4 w-4" /> Create your first batch</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map(b => {
              const left = b.seats && b.seats > 0 ? Math.max(0, b.seats - (b.seatsFilled ?? 0)) : null;
              return (
                <div key={b.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{b.name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{b.mode}</Badge>
                        <Badge className={b.status === 'open' ? 'bg-green-500/15 text-green-600' : 'bg-slate-500/15 text-slate-500'}>{b.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {b.startDate && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Starts {b.startDate}</p>}
                    {b.schedule && <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {b.schedule}</p>}
                    {b.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {b.location}</p>}
                    <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {b.seatsFilled ?? 0} joined{left === null ? '' : ` · ${left} of ${b.seats} left`}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(b.packageIds ?? []).map(pid => {
                      const p = PTE_PACKAGES.find(x => x.id === pid);
                      return p ? <span key={pid} className="text-[10px] rounded-full bg-muted px-2 py-0.5">{p.name}</span> : null;
                    })}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setViewEnrollBatch(b)}><Eye className="h-3.5 w-3.5" /> Students</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => remove(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Batch' : 'New Batch'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <Field label="Batch name">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. August 2026 — Weekday Online" className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mode">
                  <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as Batch['mode'] }))} className="input">
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid (face-to-face)</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Batch['status'] }))} className="input">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date"><input value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} placeholder="e.g. 15 Aug 2026" className="input" /></Field>
                <Field label="Total seats (0 = unlimited)"><input type="number" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: parseInt(e.target.value) || 0 }))} className="input" /></Field>
              </div>
              <Field label="Schedule"><input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Mon/Wed/Fri · 6–8 PM" className="input" /></Field>
              <Field label="Location (for hybrid)"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Nugegoda centre" className="input" /></Field>
              <Field label="Packages offered in this batch">
                <div className="grid gap-2">
                  {PTE_PACKAGES.map(p => (
                    <label key={p.id} className="flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.packageIds?.includes(p.id) ?? false} onChange={() => togglePkg(p.id)} className="h-4 w-4 accent-primary" />
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatLkr(p.price)}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="WhatsApp group invite link (optional)"><input value={form.whatsappLink} onChange={e => setForm(f => ({ ...f, whatsappLink: e.target.value }))} placeholder="https://chat.whatsapp.com/…" className="input" /></Field>
              <Field label="Note (optional)"><input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Shown to students under the batch" className="input" /></Field>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editingId ? 'Save changes' : 'Create batch'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enrollments modal ── */}
      {viewEnrollBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewEnrollBatch(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Students — {viewEnrollBatch.name}</h2>
                <p className="text-xs text-muted-foreground">{enrollments.length} paid enrollment{enrollments.length === 1 ? '' : 's'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewEnrollBatch(null)}><X className="h-4 w-4" /></Button>
            </div>
            {enrollments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No paid enrollments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Package</th><th className="py-2 pr-3">Phone</th><th className="py-2 pr-3">Email</th><th className="py-2">Paid</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {enrollments.map(e => (
                      <tr key={e.id}>
                        <td className="py-2 pr-3 font-medium">{e.fullName || '—'}</td>
                        <td className="py-2 pr-3">{e.packageName || '—'}</td>
                        <td className="py-2 pr-3">{e.phone || '—'}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{e.email || '—'}</td>
                        <td className="py-2 font-medium text-green-600">{e.amountPaid ? formatLkr(e.amountPaid) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) { border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
