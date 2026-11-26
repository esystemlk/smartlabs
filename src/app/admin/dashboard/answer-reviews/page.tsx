'use client';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/firebase';

interface Item {
  id: string; tool: string; taskType: string; userName: string; userEmail: string;
  prompt: string; answer: string; result: any; purged: boolean;
  createdAt: number; expiresAt: number; audioUrl: string;
}

const TOOLS = [
  { id: '', label: 'All' }, { id: 'speaking', label: 'Speaking' }, { id: 'essay', label: 'Essay' },
  { id: 'swt', label: 'SWT' }, { id: 'sst', label: 'SST' }, { id: 'wfd', label: 'WFD' },
];

/** The headline score each trainer returns, whatever its shape. */
function scoreOf(r: any): string {
  if (!r || typeof r !== 'object') return '';
  if (typeof r.correctWords === 'number' && typeof r.totalWords === 'number') return `${r.correctWords}/${r.totalWords} words`;
  for (const k of ['overall', 'overallScore', 'totalScore', 'total', 'score']) {
    const v = r[k];
    if (typeof v === 'number') return String(Math.round(v * 10) / 10);
    if (v && typeof v === 'object' && typeof v.score === 'number') return String(v.score);
  }
  return '';
}

const fmt = (ms: number) => (ms ? new Date(ms).toLocaleString() : '');

/** Staff review of what students answered in the PTE AI trainers. Entries are kept 200 days. */
export default function AnswerReviewsPage() {
  const { user } = useUser();
  const [tool, setTool] = useState('');
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (append: boolean, before = 0) => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const token = await user.getIdToken();
      const qs = new URLSearchParams({ tool, email: query, ...(before ? { before: String(before) } : {}) });
      const res = await fetch(`/api/admin/answer-reviews?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load');
      setItems(prev => (append ? [...prev, ...d.items] : d.items));
      setMore(!!d.more);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [user, tool, query]);

  useEffect(() => { void load(false); }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student answers</h1>
        <p className="text-sm text-slate-500 mt-1">What students wrote and said in the PTE AI trainers, with their recordings. Answers and audio are deleted automatically after 200 days; the score stays.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)}
              className={`h-9 px-3 rounded-lg text-sm font-semibold ${tool === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>{t.label}</button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); setQuery(email.trim().toLowerCase()); }} className="flex gap-2 flex-1 min-w-[240px]">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Student email (exact)" type="email"
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm" />
          <button className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold">Search</button>
          {query && <button type="button" onClick={() => { setEmail(''); setQuery(''); }} className="h-10 px-3 rounded-xl text-sm text-slate-500 hover:bg-slate-100">Clear</button>}
        </form>
      </div>

      {error && <p className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}

      <div className="space-y-3">
        {items.map(it => {
          const score = scoreOf(it.result);
          const isOpen = open === it.id;
          return (
            <div key={it.id} className="rounded-2xl border border-slate-200 bg-white">
              <button onClick={() => setOpen(isOpen ? null : it.id)} className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-xs font-bold uppercase tracking-wide rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">{it.taskType || it.tool}</span>
                <span className="font-semibold text-slate-900">{it.userName || 'Student'}</span>
                <span className="text-sm text-slate-500">{it.userEmail}</span>
                <span className="ml-auto text-sm text-slate-500">{fmt(it.createdAt)}</span>
                {score && <span className="text-sm font-bold text-slate-900">Score {score}</span>}
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 p-4 space-y-4 text-sm">
                  {it.purged ? (
                    <p className="italic text-slate-500">The answer and recording were deleted after 200 days.</p>
                  ) : (
                    <>
                      {it.audioUrl && <audio controls preload="none" src={it.audioUrl} className="w-full" />}
                      {it.prompt && (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Question</p>
                          <p className="whitespace-pre-wrap text-slate-700 max-h-48 overflow-y-auto">{it.prompt}</p>
                        </div>
                      )}
                      {it.answer && (
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Student answer</p>
                          <p className="whitespace-pre-wrap text-slate-900 bg-slate-50 rounded-xl p-3">{it.answer}</p>
                        </div>
                      )}
                    </>
                  )}
                  {it.result && (
                    <details>
                      <summary className="cursor-pointer text-xs font-bold uppercase text-slate-400">Full AI result</summary>
                      <pre className="mt-2 text-xs bg-slate-50 rounded-xl p-3 overflow-x-auto max-h-80">{JSON.stringify(it.result, null, 2)}</pre>
                    </details>
                  )}
                  {!it.purged && it.expiresAt > 0 && <p className="text-xs text-slate-400">Answer deleted on {new Date(it.expiresAt).toLocaleDateString()}</p>}
                </div>
              )}
            </div>
          );
        })}
        {!loading && !items.length && !error && <p className="text-center text-slate-500 py-10">No saved answers yet. New trainer answers appear here from now on.</p>}
      </div>

      {loading && <p className="text-center text-slate-400">Loading…</p>}
      {more && !loading && (
        <div className="text-center">
          <button onClick={() => load(true, items[items.length - 1]?.createdAt)} className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Load more</button>
        </div>
      )}
    </div>
  );
}
