'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, type Timestamp } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { IELTS_MOCKS } from '@/lib/ielts-mock/mocks';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';
import { Pic, Wordmark } from './ui';

type Profile = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface Attempt { id: string; mockId: string; title: string; status?: string; result?: IeltsMockResult; completedAt: Date | null }

const STAFF = new Set(['admin', 'developer', 'teacher']);
const future = (t?: Timestamp | null) => !!t?.toDate && t.toDate() > new Date();
const band = (n?: number) => (typeof n === 'number' ? n.toFixed(1) : '—');
const day = (d: Date | null) => (d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const ms = new Date(`${iso}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime();
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 86400000) : null;
};
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

/** Paid = any IELTS mock or essay credits, or an unexpired IELTS mock/essay plan or bundle. Read from the student's own profile. */
function planOf(p: Profile | null): 'staff' | 'paid' | 'free' {
  if (!p) return 'free';
  if (STAFF.has(p.role)) return 'staff';
  const paid = (p.ieltsMockPaidCredits ?? 0) > 0 || (p.ieltsEssayPaidCredits ?? 0) > 0
    || future(p.ieltsMockMonthlyExpiry) || future(p.ieltsEssayMonthlyExpiry) || future(p.bundleExpiry);
  return paid ? 'paid' : 'free';
}

export default function StudioDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [mockCredits, setMockCredits] = useState<{ unlimited: boolean; remaining: number } | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => { if (!isUserLoading && !user) router.replace('/studio/login?redirect=/studio'); }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        const [snap, list] = await Promise.all([
          getDoc(doc(firestore, 'users', user.uid)),
          // startedAt is on every attempt (in progress or finished), so one single-field order covers both.
          getDocs(query(collection(firestore, 'users', user.uid, 'ielts_mock_attempts'), orderBy('startedAt', 'desc'), limit(30))),
        ]);
        if (!live) return;
        setProfile(snap.data() ?? {});
        setAttempts(list.docs.map(d => { const x = d.data(); return { id: d.id, mockId: x.mockId, title: x.title, status: x.status, result: x.result, completedAt: x.completedAt?.toDate?.() ?? null }; }));
      } catch { if (live) { setLoadError('We couldn’t load your results. Refresh the page to try again.'); setAttempts([]); } }
      try {
        const res = await fetch('/api/ielts-mock-credits/balance', { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        if (live && res.ok) setMockCredits(await res.json());
      } catch { /* credits panel shows "—" */ }
    })();
    return () => { live = false; };
  }, [user, firestore]);

  const done = useMemo(() => (attempts ?? []).filter(a => a.result).sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)), [attempts]);
  const latest = done[0]?.result;
  const doneIds = new Set(done.map(a => a.mockId));
  const nextMock = IELTS_MOCKS.find(m => !doneIds.has(m.id));
  const plan = planOf(profile);
  const name = (profile?.displayName || user?.displayName || user?.email || '').split(' ')[0];
  const countdown = daysUntil(profile?.ieltsTestDate);
  const target = profile?.ieltsTargetBand as number | undefined;
  const weakest = latest ? (['listening', 'reading', 'writing'] as const).reduce((w, s) => (latest[s].band < latest[w].band ? s : w), 'listening' as 'listening' | 'reading' | 'writing') : null;
  const essayCredits = profile?.ieltsEssayPaidCredits ?? 0;

  if (isUserLoading || !user) return <p className="main" role="status">Loading your dashboard…</p>;

  const planLabel = plan === 'paid' ? 'Paid plan · all mock tests available with your credits' : plan === 'staff' ? 'Staff account · unlimited access' : 'Free plan · buy credits to take full mock tests';
  const badge = plan === 'free' ? 'badge-free' : 'badge-paid';
  const nav = [
    { href: '/dashboard/ielts/listening', icon: 'listening', label: 'Listening' },
    { href: '/dashboard/ielts/reading', icon: 'reading', label: 'Reading' },
    { href: '/dashboard/ielts/writing', icon: 'writing', label: 'Writing' },
  ] as const;

  return (
    <div className="app">
      <aside className="side">
        <Wordmark />
        <nav aria-label="Main">
          <Link href="/studio" aria-current="page">Dashboard</Link>
          <p>Practice</p>
          {nav.map(n => <Link key={n.href} href={n.href}><span className="nl"><Pic name={n.icon} />{n.label}</span></Link>)}
          <span className="nav-soon" aria-disabled="true"><span className="nl"><Pic name="speaking" className="ic faded" />Speaking</span><small>Soon</small></span>
          <p>Tests</p>
          <Link href="/dashboard/ielts/mock-tests"><span className="nl"><Pic name="mocks" />Mock tests</span><small className="num">{IELTS_MOCKS.length}</small></Link>
          <Link href="/dashboard/ielts/mock-tests#history"><span className="nl"><Pic name="results" />Results</span></Link>
          <p>Account</p>
          <Link href="/dashboard/ielts/mock-tests?buy=1"><span className="nl"><Pic name="credits" />Credits &amp; purchases</span></Link>
          <button type="button" className="nav-button" onClick={() => signOut(auth).then(() => router.replace('/studio/login'))}>Sign out</button>
        </nav>
        <div className="me">
          <div className="me-row"><Pic name={badge} className="me-badge" alt={plan === 'free' ? 'Free plan' : 'Paid plan'} /><div>{profile?.displayName || user.email}<span>{profile?.ieltsModule === 'general' ? 'General Training' : 'Academic'}{target ? ` · target ${band(target)}` : ''}</span></div></div>
          <Link className={`plan-chip${plan === 'free' ? ' free' : ''}`} href="/dashboard/ielts/mock-tests?buy=1">{plan === 'free' ? 'Free plan · Upgrade' : plan === 'staff' ? 'Staff' : 'Paid plan'}</Link>
        </div>
      </aside>

      <div>
        <div className="topbar">
          <Wordmark badge={false} />
          <span className="top-right"><Pic name={badge} className="top-badge" alt={plan === 'free' ? 'Free plan' : 'Paid plan'} /><Link className="btn secondary small" href="/dashboard/ielts/mock-tests">Mocks</Link></span>
        </div>

        <main className="main">
          <section className="greeting" aria-labelledby="hello">
            <div>
              <p className="date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h1 id="hello">{greeting()}{name ? `, ${name}` : ''}</h1>
              <p className="plan-line"><Pic name={badge} className="plan-badge" />{planLabel}</p>
            </div>
            <div className="facts">
              <div><span>Target</span><b className="num">{target ? band(target) : <small>Not set</small>}</b></div>
              <div><span>Latest overall</span><b className="num">{latest ? <>{band(latest.overall)} <small>{done[0].title.replace('IELTS ', '')}</small></> : <small>No mock yet</small>}</b></div>
              <div><span>Test day</span><b className="num">{countdown !== null ? <>{countdown} <small>{countdown === 1 ? 'day' : 'days'}</small></> : <small>Not set</small>}</b></div>
            </div>
          </section>

          {loadError && <p role="alert" className="form-error section">{loadError}</p>}

          <section className="section" aria-labelledby="next">
            <div className="continue">
              <div>
                <p className="label" style={{ margin: 0 }}>Your next step</p>
                {nextMock ? (
                  <><h3 id="next">{done.length ? `Take ${nextMock.title}` : 'Take your first full mock test'}</h3>
                    <p>Listening, Reading and Writing in one sitting, timed like test day. You get a band for each skill and an overall band.</p></>
                ) : (
                  <><h3 id="next">You&rsquo;ve taken all {IELTS_MOCKS.length} mock tests</h3>
                    <p>Keep practising your weakest skill{weakest ? `, ${weakest[0].toUpperCase()}${weakest.slice(1)}` : ''}, with timed Cambridge sets.</p></>
                )}
                <div className="meter" role="img" aria-label={`${doneIds.size} of ${IELTS_MOCKS.length} mock tests completed`}><i style={{ width: `${(doneIds.size / IELTS_MOCKS.length) * 100}%` }} /></div>
              </div>
              <Link className="btn accent" href={nextMock ? `/dashboard/ielts/mock-tests/${nextMock.id}` : `/dashboard/ielts/${weakest ?? 'reading'}`}>{nextMock ? 'Start mock' : 'Practise now'}</Link>
            </div>
          </section>

          <section className="section" aria-labelledby="skills-h">
            <div className="section-head"><h2 id="skills-h">Your skills</h2><span className="muted" style={{ fontSize: 14 }}>{latest ? `From ${done[0].title}` : 'Bands appear after your first mock'}</span></div>
            <div className="skills">
              {(['listening', 'reading', 'writing'] as const).map(s => {
                const r = latest?.[s];
                return (
                  <Link className="skill" key={s} href={`/dashboard/ielts/${s}`}>
                    <Pic name={s} className="skill-ic" />
                    <h3>{s[0].toUpperCase() + s.slice(1)}</h3>
                    {r ? <span className="band num">{band(r.band)} <small>/ 9</small></span> : <span className="band soon-band">No mock yet</span>}
                    <p>{r ? (s === 'writing' ? `Task 1 ${band(latest!.writing.task1Band)} · Task 2 ${band(latest!.writing.task2Band)}` : r.total ? `${r.raw ?? 0} of ${r.total} correct` : r.label) : s === 'writing' ? 'Task 1 reports and Task 2 essays' : 'Timed Cambridge practice sets'}</p>
                    <span className="go">{s === 'writing' ? 'Write →' : 'Practise →'}</span>
                  </Link>
                );
              })}
              <div className="skill soon" aria-disabled="true">
                <Pic name="speaking" className="skill-ic faded" />
                <h3>Speaking</h3>
                <span className="band">Coming soon</span>
                <p>Interview, cue card and discussion practice are being built.</p>
              </div>
            </div>
          </section>

          <div className="two section">
            <section aria-labelledby="results-h">
              <div className="section-head"><h2 id="results-h" className="ic-head"><Pic name="results" />Mock results</h2><Link href="/dashboard/ielts/mock-tests#history">All results</Link></div>
              {attempts === null ? <p className="empty" role="status">Loading results…</p> : done.length === 0 ? (
                <p className="empty">No results yet. Your band scores appear here after you finish a mock test.</p>
              ) : (
                <table className="list">
                  <thead><tr><th scope="col">Mock</th><th scope="col" className="hide-sm">Date</th><th scope="col">Overall</th><th scope="col"><span className="hide-sm">Report</span></th></tr></thead>
                  <tbody>{done.slice(0, 6).map(a => (
                    <tr key={a.id}>
                      <td>{a.title}<br /><span className="muted" style={{ fontSize: 13 }}>L {band(a.result!.listening.band)} · R {band(a.result!.reading.band)} · W {band(a.result!.writing.band)}</span></td>
                      <td className="hide-sm num muted">{day(a.completedAt)}</td>
                      <td className="score num">{band(a.result!.overall)}</td>
                      <td><Link href="/dashboard/ielts/mock-tests#history">View</Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </section>

            <div>
              <section aria-labelledby="mocks-h">
                <div className="section-head"><h2 id="mocks-h" className="ic-head"><Pic name="mocks" />Mock tests</h2><Link href="/dashboard/ielts/mock-tests">About the mocks</Link></div>
                <div className="mocks">
                  {IELTS_MOCKS.map((m, i) => {
                    const last = done.find(a => a.mockId === m.id);
                    return (
                      <div className="mock" key={m.id}>
                        <span className="n num">{i + 1}</span>
                        <div><h3>{m.title}</h3><p>{last ? `Completed ${day(last.completedAt)} · overall ${band(last.result!.overall)}` : 'Listening, Reading, Writing'}</p></div>
                        {last ? <span className="tag ok">Done</span> : <Link className="btn secondary small" href={`/dashboard/ielts/mock-tests/${m.id}`}>Start</Link>}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="panel section" aria-labelledby="credits-h" style={{ marginTop: 28 }}>
                <h3 id="credits-h" className="ic-head"><Pic name="credits" />Credits</h3>
                <div className="credit-row"><span>Mock test credits</span><b className="num">{mockCredits ? (mockCredits.unlimited ? 'Unlimited' : mockCredits.remaining) : '—'}</b></div>
                <div className="credit-row"><span>Writing feedback credits</span><b className="num">{profile ? essayCredits : '—'}</b></div>
                <p className="muted" style={{ fontSize: 13, margin: '10px 0 14px' }}>Shared with your Smart Labs account.</p>
                <Link className="btn secondary small block" href="/dashboard/ielts/mock-tests?buy=1">Buy credits</Link>
              </section>
            </div>
          </div>
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        <Link href="/studio" aria-current="page">Home</Link>
        {nav.map(n => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        <Link href="/dashboard/ielts/mock-tests">Mocks</Link>
      </nav>
    </div>
  );
}
