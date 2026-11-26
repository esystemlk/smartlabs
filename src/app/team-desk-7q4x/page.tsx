'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { Loader2, LogOut, Plus, Pencil, Trash2, Paperclip, Download, AlertTriangle, Lock, Unlock, Check, X, Users, Wallet, BookOpen, Settings } from 'lucide-react';
import { PAYMENT_METHODS, type CoordEntry, type CoordSummaryRow } from '@/lib/coordinators';

type Course = { id: string; name: string; batches: { id: string; name: string; fee: number }[] };
type Entry = CoordEntry & { duplicate?: boolean; counts?: boolean };
interface Data {
  me: { name: string; email: string; isDev: boolean; currentMonth: string };
  month: string;
  courses: Course[];
  entries: Entry[];
  related?: Entry[];
  summary?: CoordSummaryRow[];
  settings?: { coordinatorEmails: string[]; managementEmails: string[] };
}

const lkr = (n: number) => 'LKR ' + Math.round(n).toLocaleString('en-LK');
const monthLabel = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const lastMonths = (from: string, n = 12) => {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number);
  for (let i = 0; i < n; i++) { out.push(`${y}-${String(m).padStart(2, '0')}`); m--; if (!m) { m = 12; y--; } }
  return out;
};
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
const field = 'w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

export default function TeamDeskPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const token = await user!.getIdToken();
    const res = await fetch(path, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    if (res.headers.get('content-type')?.includes('text/csv')) return res;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || 'Something went wrong'), { status: res.status });
    return body;
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { const d = await api(`/api/coord${month ? `?month=${month}` : ''}`); setData(d); setError(''); if (!month) setMonth(d.month); }
    catch (e) { setError((e as Error).message); setData(null); }
    finally { setLoading(false); }
  }, [user, api, month]);
  useEffect(() => { void load(); }, [load]);

  if (isUserLoading) return <Screen><Loader2 className="animate-spin text-slate-400" /></Screen>;
  if (!user) return <Screen><SignIn auth={auth} /></Screen>;
  if (error && !data) {
    return (
      <Screen>
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <Lock className="mx-auto text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">{error}</p>
          <p className="mt-1 text-sm text-slate-500">Signed in as {user.email}</p>
          <button onClick={() => signOut(auth!)} className="mt-5 h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold">Use another account</button>
        </div>
      </Screen>
    );
  }
  if (!data) return <Screen><Loader2 className="animate-spin text-slate-400" /></Screen>;

  return (
    <div className="min-h-screen bg-[#F3F5FC] text-slate-900">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f6bff] text-white grid place-items-center font-bold">SL</span>
          <div className="min-w-0">
            <p className="font-bold leading-tight">Team desk</p>
            <p className="text-xs text-slate-500 truncate">{data.me.name} · {data.me.isDev ? 'Developer' : 'Coordinator'}</p>
          </div>
          <select value={month} onChange={e => setMonth(e.target.value)} className="ml-auto h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">
            {lastMonths(data.me.currentMonth).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button onClick={() => signOut(auth!)} title="Sign out" className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 text-slate-500"><LogOut size={18} /></button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {error && <p className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
        {loading && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Updating…</p>}
        {data.me.isDev ? <DevView data={data} api={api} reload={load} setError={setError} /> : <CoordView data={data} api={api} reload={load} setError={setError} />}
      </main>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#FFF7E6] px-4">{children}</div>;
}

function SignIn({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await signInWithEmailAndPassword(auth!, email.trim(), password); }
    catch { setMsg('Email or password is not correct.'); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (!email.trim()) { setMsg('Type your email first, then tap "Forgot password".'); return; }
    try { await sendPasswordResetEmail(auth!, email.trim()); setMsg('A password reset link was sent to your email.'); } catch { setMsg('Could not send the reset email.'); }
  };
  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl border border-slate-100 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Team desk</h1>
        <p className="text-sm text-slate-500 mt-1">Smart Labs coordinators only.</p>
      </div>
      <input className={field} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
      <input className={field} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button disabled={busy} className="w-full h-11 rounded-xl bg-[#2563eb] text-white font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />} Sign in</button>
      <button type="button" onClick={reset} className="w-full text-sm text-slate-500 hover:text-slate-800">Forgot password</button>
    </form>
  );
}

type ApiFn = (path: string, init?: RequestInit) => Promise<any>;
type ViewProps = { data: Data; api: ApiFn; reload: () => Promise<void>; setError: (s: string) => void };

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
      <span className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563eb] grid place-items-center"><Icon size={18} /></span>
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold">{value}</p></div>
    </div>
  );
}

function CoordView({ data, api, reload, setError }: ViewProps) {
  const [editing, setEditing] = useState<Entry | 'new' | null>(null);
  const [showCourses, setShowCourses] = useState(false);
  const open = data.month === data.me.currentMonth;
  const paid = data.entries.reduce((n, e) => n + e.paid, 0);
  const balance = data.entries.reduce((n, e) => n + Math.max(0, e.fee - e.paid), 0);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={Users} label={`Students · ${monthLabel(data.month)}`} value={data.entries.length} />
        <Stat icon={Wallet} label="Paid so far" value={lkr(paid)} />
        <Stat icon={AlertTriangle} label="Balance due" value={lkr(balance)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {open && <button onClick={() => setEditing('new')} className="h-11 px-5 rounded-xl bg-[#2563eb] text-white font-semibold inline-flex items-center gap-2"><Plus size={18} /> Add student</button>}
        <button onClick={() => setShowCourses(true)} className="h-11 px-4 rounded-xl border border-slate-200 bg-white font-semibold inline-flex items-center gap-2"><BookOpen size={18} /> Courses &amp; batches</button>
        {!open && <p className="text-sm text-slate-500 flex items-center gap-1.5"><Lock size={14} /> This month is closed. Only unlocked entries can be changed.</p>}
      </div>
      <EntryTable entries={data.entries} api={api} reload={reload} setError={setError} onEdit={e => setEditing(e)} canChange={e => open || !!e.unlocked} />
      {editing && <EntryForm courses={data.courses} entry={editing === 'new' ? null : editing} api={api} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); }} onAddCourse={() => setShowCourses(true)} />}
      {showCourses && <CoursesDialog courses={data.courses} api={api} isDev={false} onClose={() => setShowCourses(false)} reload={reload} />}
    </>
  );
}

function EntryTable({ entries, api, reload, setError, onEdit, canChange, dev }: { entries: Entry[]; api: ApiFn; reload: () => Promise<void>; setError: (s: string) => void; onEdit: (e: Entry) => void; canChange: (e: Entry) => boolean; dev?: boolean }) {
  const [busy, setBusy] = useState('');
  const act = async (id: string, fn: () => Promise<unknown>) => { setBusy(id); try { await fn(); await reload(); } catch (e) { setError((e as Error).message); } finally { setBusy(''); } };
  const viewSlip = (id: string) => act(id, async () => { const d = await api(`/api/coord/slip?id=${id}`); window.open(d.url, '_blank', 'noopener'); });
  const upload = (e: Entry) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp,application/pdf';
    input.onchange = () => { const f = input.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('id', e.id); fd.append('file', f); void act(e.id, () => api('/api/coord/slip', { method: 'POST', body: fd })); };
    input.click();
  };
  if (!entries.length) return <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-500">No students for this month yet.</div>;
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[880px]">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>{dev && <th className="p-3">Coordinator</th>}<th className="p-3">Student</th><th className="p-3">Course / batch</th><th className="p-3">Paid</th><th className="p-3">Method</th><th className="p-3">Slip</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const bal = Math.max(0, e.fee - e.paid);
            return (
              <tr key={e.id} className={`border-t border-slate-100 align-top ${e.duplicate && !e.dupDecision ? 'bg-amber-50/60' : ''}`}>
                {dev && <td className="p-3 font-medium">{e.coordinatorName}</td>}
                <td className="p-3">
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-slate-500">{e.phone} · {e.email}</p>
                  {e.duplicate && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <AlertTriangle size={12} /> Same number as another coordinator{e.dupDecision === 'credit' ? ' · credited' : e.dupDecision === 'no-credit' ? ' · not credited' : ''}
                    </p>
                  )}
                  {e.note && <p className="text-xs text-slate-400 mt-1">{e.note}</p>}
                </td>
                <td className="p-3">{e.courseName}<p className="text-slate-500">{e.batchName}</p></td>
                <td className="p-3"><p className="font-semibold">{lkr(e.paid)}</p><p className={bal ? 'text-amber-700' : 'text-emerald-700'}>{bal ? `${lkr(bal)} due` : 'Fully paid'}</p></td>
                <td className="p-3">{e.method}<p className="text-slate-500">{e.paidOn}</p></td>
                <td className="p-3">
                  {e.slipPath ? <button onClick={() => viewSlip(e.id)} className="text-[#2563eb] font-semibold">View</button> : <span className="text-slate-400">None</span>}
                  {canChange(e) && <button onClick={() => upload(e)} className="block text-xs text-slate-500 hover:text-slate-800 mt-1"><Paperclip size={12} className="inline" /> {e.slipPath ? 'Replace' : 'Upload'}</button>}
                </td>
                <td className="p-3 whitespace-nowrap text-right">
                  {busy === e.id ? <Loader2 size={16} className="animate-spin inline text-slate-400" /> : (
                    <>
                      {dev && e.duplicate && (
                        <span className="inline-flex gap-1 mr-2">
                          <button title="Give this coordinator the credit" onClick={() => act(e.id, () => api('/api/coord/entries', { method: 'PATCH', body: JSON.stringify({ id: e.id, dupDecision: 'credit' }) }))} className={`h-8 px-2 rounded-lg text-xs font-semibold ${e.dupDecision === 'credit' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}><Check size={12} className="inline" /> Credit</button>
                          <button title="Don't count it for this coordinator" onClick={() => act(e.id, () => api('/api/coord/entries', { method: 'PATCH', body: JSON.stringify({ id: e.id, dupDecision: 'no-credit' }) }))} className={`h-8 px-2 rounded-lg text-xs font-semibold ${e.dupDecision === 'no-credit' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}><X size={12} className="inline" /> No</button>
                        </span>
                      )}
                      {dev && e.month !== undefined && (
                        <button title={e.unlocked ? 'Lock again' : 'Let the coordinator edit this after the month closed'} onClick={() => act(e.id, () => api('/api/coord/entries', { method: 'PATCH', body: JSON.stringify({ id: e.id, unlocked: !e.unlocked }) }))} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500">{e.unlocked ? <Unlock size={15} /> : <Lock size={15} />}</button>
                      )}
                      {canChange(e) && <button title="Edit" onClick={() => onEdit(e)} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={15} /></button>}
                      {canChange(e) && <button title="Delete" onClick={() => { if (confirm(`Delete ${e.name}?`)) void act(e.id, () => api(`/api/coord/entries?id=${e.id}`, { method: 'DELETE' })); }} className="h-8 w-8 inline-grid place-items-center rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EntryForm({ courses, entry, api, onClose, onSaved, onAddCourse }: { courses: Course[]; entry: Entry | null; api: ApiFn; onClose: () => void; onSaved: () => Promise<void>; onAddCourse: () => void }) {
  const [f, setF] = useState({
    name: entry?.name || '', phone: entry?.phone || '', email: entry?.email || '',
    courseId: entry?.courseId || '', batchId: entry?.batchId || '',
    fee: entry ? String(entry.fee) : '', paid: entry ? String(entry.paid) : '',
    method: entry?.method || 'Bank transfer', paidOn: entry?.paidOn || today(), note: entry?.note || '',
  });
  const [slip, setSlip] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const course = courses.find(c => c.id === f.courseId);
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const pickBatch = (id: string) => { const b = course?.batches.find(x => x.id === id); setF(p => ({ ...p, batchId: id, fee: b && !p.fee ? String(b.fee || '') : p.fee })); };
  const balance = Math.max(0, (Number(f.fee) || 0) - (Number(f.paid) || 0));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const body = JSON.stringify({ ...f, fee: Number(f.fee), paid: Number(f.paid), ...(entry ? { id: entry.id } : {}) });
      const r = await api('/api/coord/entries', { method: entry ? 'PATCH' : 'POST', body });
      const id = entry?.id || r.id;
      if (slip) { const fd = new FormData(); fd.append('id', id); fd.append('file', slip); await api('/api/coord/slip', { method: 'POST', body: fd }); }
      await onSaved();
    } catch (err) { setMsg((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={() => !busy && onClose()}>
      <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{entry ? 'Edit student' : 'Add student'}</h2>
          <button type="button" onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="sm:col-span-2 text-sm font-semibold">Student name<input className={`${field} mt-1`} value={f.name} onChange={e => set('name', e.target.value)} required /></label>
          <label className="text-sm font-semibold">Contact number<input className={`${field} mt-1`} type="tel" placeholder="077 123 4567" value={f.phone} onChange={e => set('phone', e.target.value)} required /></label>
          <label className="text-sm font-semibold">Email<input className={`${field} mt-1`} type="email" value={f.email} onChange={e => set('email', e.target.value)} required /></label>
          <label className="text-sm font-semibold">Course
            <select className={`${field} mt-1`} value={f.courseId} onChange={e => setF(p => ({ ...p, courseId: e.target.value, batchId: '' }))} required>
              <option value="">Choose…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Batch
            <select className={`${field} mt-1`} value={f.batchId} onChange={e => pickBatch(e.target.value)} required disabled={!course}>
              <option value="">{course ? 'Choose…' : 'Pick a course first'}</option>
              {course?.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={onAddCourse} className="sm:col-span-2 -mt-1 text-left text-xs font-semibold text-[#2563eb]">Course or batch missing? Add it</button>
          <label className="text-sm font-semibold">Course fee (LKR)<input className={`${field} mt-1`} type="number" min={1} value={f.fee} onChange={e => set('fee', e.target.value)} required /></label>
          <label className="text-sm font-semibold">Amount paid (LKR)<input className={`${field} mt-1`} type="number" min={0} value={f.paid} onChange={e => set('paid', e.target.value)} required /></label>
          <p className="sm:col-span-2 text-sm text-slate-500">{balance ? `Balance due: ${lkr(balance)}` : f.fee ? 'Fully paid' : ''}</p>
          <label className="text-sm font-semibold">Payment method
            <select className={`${field} mt-1`} value={f.method} onChange={e => set('method', e.target.value)}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select>
          </label>
          <label className="text-sm font-semibold">Date paid<input className={`${field} mt-1`} type="date" value={f.paidOn} onChange={e => set('paidOn', e.target.value)} required /></label>
          <label className="sm:col-span-2 text-sm font-semibold">Payment slip (photo or PDF, optional)
            <input className="mt-1 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setSlip(e.target.files?.[0] || null)} />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold">Note (optional)<input className={`${field} mt-1`} value={f.note} onChange={e => set('note', e.target.value)} /></label>
        </div>
        {msg && <p className="rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm">{msg}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={busy} className="h-11 px-6 rounded-xl bg-[#2563eb] text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />} Save</button>
        </div>
      </form>
    </div>
  );
}

function CoursesDialog({ courses, api, isDev, onClose, reload }: { courses: Course[]; api: ApiFn; isDev: boolean; onClose: () => void; reload: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [batch, setBatch] = useState<Record<string, { name: string; fee: string }>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setMsg(''); try { await fn(); await reload(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={() => !busy && onClose()}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Courses &amp; batches</h2>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); void run(async () => { await api('/api/coord/courses', { method: 'POST', body: JSON.stringify({ name }) }); setName(''); }); }} className="flex gap-2">
          <input className={field} placeholder="New course name, e.g. PTE Boostify" value={name} onChange={e => setName(e.target.value)} required />
          <button disabled={busy} className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold whitespace-nowrap">Add course</button>
        </form>
        {msg && <p className="rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm">{msg}</p>}
        {courses.map(c => {
          const b = batch[c.id] || { name: '', fee: '' };
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold">{c.name}</p>
                {isDev && <button onClick={() => { if (confirm(`Delete course ${c.name}? Saved students keep its name.`)) void run(() => api(`/api/coord/courses?id=${c.id}`, { method: 'DELETE' })); }} className="text-red-500 text-xs font-semibold">Delete</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {c.batches.length ? c.batches.map(x => (
                  <span key={x.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">{x.name}{x.fee ? <span className="text-slate-500">{lkr(x.fee)}</span> : null}
                    {isDev && <button onClick={() => void run(() => api(`/api/coord/courses?id=${c.id}&batch=${x.id}`, { method: 'DELETE' }))} className="text-slate-400 hover:text-red-500"><X size={12} /></button>}
                  </span>
                )) : <span className="text-sm text-slate-400">No batches yet</span>}
              </div>
              <form onSubmit={e => { e.preventDefault(); void run(async () => { await api('/api/coord/courses', { method: 'POST', body: JSON.stringify({ courseId: c.id, batchName: b.name, fee: Number(b.fee) || 0 }) }); setBatch(p => ({ ...p, [c.id]: { name: '', fee: '' } })); }); }} className="flex gap-2">
                <input className={field} placeholder="New batch, e.g. Dec 2026 Weekend" value={b.name} onChange={e => setBatch(p => ({ ...p, [c.id]: { ...b, name: e.target.value } }))} required />
                <input className={`${field} max-w-[130px]`} type="number" min={0} placeholder="Fee (LKR)" value={b.fee} onChange={e => setBatch(p => ({ ...p, [c.id]: { ...b, fee: e.target.value } }))} />
                <button disabled={busy} className="h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold whitespace-nowrap">Add batch</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DevView({ data, api, reload, setError }: ViewProps) {
  const [tab, setTab] = useState<'overview' | 'students' | 'duplicates' | 'settings'>('overview');
  const [who, setWho] = useState('');
  const [editing, setEditing] = useState<Entry | null>(null);
  const [showCourses, setShowCourses] = useState(false);
  const entries = useMemo(() => data.entries.filter(e => !who || e.coordinatorUid === who), [data.entries, who]);
  const coordinators = useMemo(() => [...new Map(data.entries.map(e => [e.coordinatorUid, e.coordinatorName])).entries()], [data.entries]);
  const dups = [...data.entries.filter(e => e.duplicate), ...(data.related || [])];
  const waiting = data.entries.filter(e => e.duplicate && !e.dupDecision).length;
  const download = async () => {
    try {
      const res: Response = await api(`/api/coord/report?month=${data.month}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a'); a.href = url; a.download = `smartlabs-coordinators-${data.month}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
  };
  const total = (data.summary || []).reduce((n, r) => n + r.students, 0);

  return (
    <>
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white border border-slate-200 w-fit">
        {([['overview', 'Overview'], ['students', `Students (${data.entries.length})`], ['duplicates', `Duplicates${waiting ? ` (${waiting})` : ''}`], ['settings', 'Settings']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-10 px-4 rounded-xl text-sm font-semibold ${tab === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat icon={Users} label={`Students counted · ${monthLabel(data.month)}`} value={total} />
            <Stat icon={Wallet} label="Total paid" value={lkr((data.summary || []).reduce((n, r) => n + r.paid, 0))} />
            <Stat icon={AlertTriangle} label="Duplicates waiting" value={waiting} />
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Coordinator</th><th className="p-3">Students counted</th><th className="p-3">Waiting (duplicates)</th><th className="p-3">Fees</th><th className="p-3">Paid</th><th className="p-3">Balance due</th></tr></thead>
              <tbody>
                {(data.summary || []).map(r => (
                  <tr key={r.email} className="border-t border-slate-100"><td className="p-3 font-semibold">{r.coordinator}<p className="text-xs text-slate-500 font-normal">{r.email}</p></td><td className="p-3 text-lg font-bold">{r.students}</td><td className="p-3">{r.flagged || '–'}</td><td className="p-3">{lkr(r.fees)}</td><td className="p-3">{lkr(r.paid)}</td><td className="p-3">{lkr(r.balance)}</td></tr>
                ))}
                {!data.summary?.length && <tr><td className="p-6 text-center text-slate-500" colSpan={6}>No students entered in {monthLabel(data.month)}.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className="h-11 px-5 rounded-xl bg-[#2563eb] text-white font-semibold inline-flex items-center gap-2"><Download size={18} /> Download Excel (CSV)</button>
            <button onClick={() => setShowCourses(true)} className="h-11 px-4 rounded-xl border border-slate-200 bg-white font-semibold inline-flex items-center gap-2"><BookOpen size={18} /> Courses &amp; batches</button>
          </div>
          <p className="text-sm text-slate-500">The report for each month is also emailed to management automatically at 9:00 AM on the 1st of the next month.</p>
        </>
      )}

      {tab === 'students' && (
        <>
          <select value={who} onChange={e => setWho(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="">All coordinators</option>
            {coordinators.map(([uid, name]) => <option key={uid} value={uid}>{name}</option>)}
          </select>
          <EntryTable entries={entries} api={api} reload={reload} setError={setError} onEdit={setEditing} canChange={() => true} dev />
        </>
      )}

      {tab === 'duplicates' && (
        <>
          <p className="text-sm text-slate-600">Students whose contact number was entered by more than one coordinator. They don&apos;t count for anyone until you choose <b>Credit</b> on the coordinator who should get them. Coordinators never see this.</p>
          <EntryTable entries={dups.sort((a, b) => a.phone.localeCompare(b.phone) || a.createdAt - b.createdAt)} api={api} reload={reload} setError={setError} onEdit={setEditing} canChange={() => true} dev />
        </>
      )}

      {tab === 'settings' && data.settings && <SettingsForm settings={data.settings} api={api} reload={reload} />}

      {editing && <EntryForm courses={data.courses} entry={editing} api={api} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); }} onAddCourse={() => setShowCourses(true)} />}
      {showCourses && <CoursesDialog courses={data.courses} api={api} isDev onClose={() => setShowCourses(false)} reload={reload} />}
    </>
  );
}

function SettingsForm({ settings, api, reload }: { settings: NonNullable<Data['settings']>; api: ApiFn; reload: () => Promise<void> }) {
  const [coords, setCoords] = useState(settings.coordinatorEmails.join('\n'));
  const [mgmt, setMgmt] = useState(settings.managementEmails.join('\n'));
  const [msg, setMsg] = useState('');
  const split = (s: string) => s.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    try { await api('/api/coord', { method: 'POST', body: JSON.stringify({ coordinatorEmails: split(coords), managementEmails: split(mgmt) }) }); setMsg('Saved.'); await reload(); }
    catch (err) { setMsg((err as Error).message); }
  };
  return (
    <form onSubmit={save} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5 max-w-xl">
      <div className="flex items-center gap-2 font-bold"><Settings size={18} /> Settings</div>
      <label className="block text-sm font-semibold">Coordinator emails (one per line)
        <textarea className="mt-1 w-full min-h-[90px] rounded-xl border border-slate-200 p-3 text-sm font-normal" value={coords} onChange={e => setCoords(e.target.value)} />
        <span className="text-xs font-normal text-slate-500">These people can sign in at this link. Each needs a Smart Labs account with that email.</span>
      </label>
      <label className="block text-sm font-semibold">Management emails for the monthly report (one per line)
        <textarea className="mt-1 w-full min-h-[70px] rounded-xl border border-slate-200 p-3 text-sm font-normal" value={mgmt} onChange={e => setMgmt(e.target.value)} />
        <span className="text-xs font-normal text-slate-500">Empty = the report goes to the Smart Labs company mailbox.</span>
      </label>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button className="h-11 px-6 rounded-xl bg-slate-900 text-white font-semibold">Save settings</button>
    </form>
  );
}
