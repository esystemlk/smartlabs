'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';
import { ArrowLeft, Loader2, Search, FileDown, Ticket, ShieldAlert, User } from 'lucide-react';

interface AttemptRow {
  id: string; title: string; overall: number;
  listeningBand: number; readingBand: number; writingBand: number;
  completedAtMs: number; result: IeltsMockResult;
}

const fmtDate = (ms: number) => { try { return ms ? new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; } catch { return '—'; } };

export default function AdminIeltsMocksPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState<{ name: string; email: string } | null>(null);
  const [rows, setRows] = useState<AttemptRow[] | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else { setAllowed(false); router.replace('/dashboard'); }
    });
  }, [user, isUserLoading, firestore, router]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!user || !email.trim()) return;
    setSearching(true); setError(''); setStudent(null); setRows(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/ielts-mocks?email=${encodeURIComponent(email.trim())}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not search.'); return; }
      setStudent(data.student);
      setRows(data.attempts ?? []);
    } catch { setError('Network error.'); }
    finally { setSearching(false); }
  }

  async function downloadPdf(row: AttemptRow) {
    setPdfBusy(row.id);
    try {
      const [{ pdf }, { IeltsMockScorePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/ielts/IeltsMockScorePDF'),
      ]);
      const meta = {
        studentName: student?.name || 'Student',
        studentEmail: student?.email,
        date: (row.completedAtMs ? new Date(row.completedAtMs) : new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      };
      const blob = await pdf(<IeltsMockScorePDF meta={meta} result={row.result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartLabs_IELTS_Mock_${row.title.replace(/[^a-z0-9]+/gi, '_')}_${(student?.name || 'Student').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error('admin mock PDF failed', err); } finally { setPdfBusy(null); }
  }

  if (isUserLoading || allowed === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={15} /> Admin dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 bg-slate-900"><Ticket size={22} /></div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">IELTS Mocks</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Student Results</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-5">Search a student by their exact email to view and download the IELTS mock results they have completed. Only students who have taken a mock will return results.</p>

        <form onSubmit={search} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="student@email.com"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>
          <button type="submit" disabled={searching || !email.trim()} className="inline-flex items-center gap-1.5 text-sm font-black text-white px-5 py-2.5 rounded-xl bg-slate-900 disabled:opacity-50">
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Search
          </button>
        </form>

        {error && <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 mb-4"><ShieldAlert size={15} /> {error}</p>}

        {student && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><User size={18} /></span>
            <div>
              <p className="text-sm font-black text-slate-900">{student.name}</p>
              <p className="text-xs text-slate-500">{student.email}</p>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400">{rows?.length ?? 0} completed mock{(rows?.length ?? 0) === 1 ? '' : 's'}</span>
          </div>
        )}

        {rows && rows.length === 0 && student && (
          <p className="text-sm text-slate-500">This student has not completed any mock tests yet.</p>
        )}

        {rows && rows.length > 0 && (
          <div className="space-y-2.5">
            {rows.map(row => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{row.title}</p>
                  <p className="text-[12px] text-slate-500">{fmtDate(row.completedAtMs)} · L {row.listeningBand} · R {row.readingBand} · W {row.writingBand}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Overall</p>
                    <p className="text-xl font-black leading-tight text-slate-900">{row.overall}</p>
                  </div>
                  <button onClick={() => downloadPdf(row)} disabled={pdfBusy === row.id} className="inline-flex items-center gap-1.5 text-xs font-black text-white px-3 py-2 rounded-xl bg-slate-900 disabled:opacity-60">
                    {pdfBusy === row.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
