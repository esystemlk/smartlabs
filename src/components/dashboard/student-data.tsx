'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import type { TestResult } from '@/lib/services/test-results.service';

interface Payment { orderId: string; course: string; amount: number; status: string; createdAtMs: number }
const statuses: Record<string,string> = { success:'Paid', pending:'Payment pending', failed:'Payment failed', cancelled:'Cancelled', amount_mismatch:'Amount issue', chargedback:'Charged back' };
export function RegistrationRecords({ compact = false }: { compact?: boolean }) {
  const { user } = useUser();
  const [rows, setRows] = useState<Payment[]>([]);
  const [state,setState] = useState('loading');
  const [retry,setRetry] = useState(0);
  useEffect(() => { if(!user) return; let active=true; setState('loading');
    (async()=>{try{ const token=await user.getIdToken(); const response=await fetch('/api/account/payments',{headers:{Authorization:`Bearer ${token}`}}); if(!response.ok) throw Error('load'); const data=await response.json(); if(active){setRows(data.payments??[]);setState('ready');}}catch{if(active)setState('error');}})();
    return()=>{active=false};
  },[user,retry]);
  if(state==='loading') return <p className="student-empty" role="status">Loading your registrations…</p>;
  if(state==='error') return <div className="student-empty"><p className="student-error">We couldn’t load your registrations.</p><button className="student-text-link" onClick={()=>setRetry(x=>x+1)}>Try again</button></div>;
  if(!rows.length) return <div className="student-empty"><p>No course registrations found for this account.</p><Link className="student-text-link" href="/courses">Explore courses →</Link></div>;
  return <div>{(compact?rows.slice(0,2):rows).map(row=><article className="student-record" key={row.orderId}><div><h3>{row.course}</h3><p>{row.createdAtMs?new Date(row.createdAtMs).toLocaleDateString():'Date unavailable'}</p><small>Reference: {row.orderId}</small></div><div><span className="student-status">{statuses[row.status]??'Status unavailable'}</span><p>LKR {Number(row.amount||0).toLocaleString('en-LK')}</p></div></article>)}</div>;
}
export function PracticeResults({ compact=false }: { compact?:boolean }) {
 const {user}=useUser(); const firestore=useFirestore();
 const [rows,setRows]=useState<TestResult[]>([]); const [state,setState]=useState('loading'); const [filter,setFilter]=useState('All'); const [retry,setRetry]=useState(0);
 useEffect(()=>{if(!user||!firestore)return;let active=true;setState('loading');getDocs(query(collection(firestore,'test_results'),where('userId','==',user.uid),orderBy('completedAt','desc'),limit(100))).then(snapshot=>{if(active){setRows(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}) as TestResult));setState('ready')}}).catch(()=>{if(active)setState('error')});return()=>{active=false}},[user,firestore,retry]);
 if(state==='loading')return <p className="student-empty" role="status">Loading saved practice results…</p>;
 if(state==='error')return <div className="student-empty"><p className="student-error">We couldn’t load your practice history.</p><button className="student-text-link" onClick={()=>setRetry(x=>x+1)}>Try again</button></div>;
 const shown=rows.filter(row=>filter==='All'||row.testType?.toLowerCase().includes(filter.toLowerCase()));
 return <div>{!compact&&<><div className="student-tabs" aria-label="Filter practice results">{['All','PTE','IELTS'].map(label=><button key={label} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label}</button>)}</div><p className="student-muted mt-4">Saved practice history, up to your latest 100 records. Each score uses its own task scale.</p></>}{!shown.length?<p className="student-empty">No saved practice results{filter==='All'?'':` for ${filter}`} yet.</p>:(compact?shown.slice(0,3):shown).map(row=><article className="student-record" key={row.id}><div><h3>{row.testType} · {row.category}</h3><p>{row.testId}</p><small>{row.completedAt?.toDate?row.completedAt.toDate().toLocaleDateString():'Date unavailable'}</small>{!compact&&row.breakdown&&<details><summary className="student-text-link">Score details</summary>{Object.entries(row.breakdown).map(([label,value])=><p key={label}>{label}: {String(value)}</p>)}</details>}</div><strong>{row.score} / {row.maxScore}</strong></article>)}{!compact&&<p className="student-muted mt-5">IELTS mock reports are available in <Link className="student-text-link" href="/dashboard/ielts/mock-tests">IELTS Mock tests →</Link>Practice scores are estimates, not official exam results.</p>}</div>;
}
