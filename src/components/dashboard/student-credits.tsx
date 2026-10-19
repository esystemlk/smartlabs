'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { Coins, ArrowRight, RefreshCw } from 'lucide-react';
import { studentCreditBalances } from '@/lib/student-credits';

export function StudentCredits() {
  const {user}=useUser(); const firestore=useFirestore();
  const [account,setAccount]=useState<{uid:string;data:Record<string,unknown>;cached:boolean}|null>(null);
  const [error,setError]=useState(false); const [retry,setRetry]=useState(0); const [now,setNow]=useState(Date.now);
  useEffect(()=>{if(!user||!firestore)return;setError(false);setAccount(null);return onSnapshot(doc(firestore,'users',user.uid),{includeMetadataChanges:true},snapshot=>{
    if(!snapshot.exists()){setError(true);return;}
    setAccount({uid:user.uid,data:snapshot.data(),cached:snapshot.metadata.fromCache});setError(false);setNow(Date.now());
  },()=>setError(true));},[user,firestore,retry]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[]);
  if(!user)return null;
  const ready=account?.uid===user.uid?account:null;
  return <section className="student-panel student-credit-panel" aria-labelledby="student-credit-heading">
    <div className="student-section-heading"><h2 id="student-credit-heading"><Coins size={22}/> Your credits</h2><Link href="/credits">Buy AI credits <ArrowRight size={15}/></Link></div>
    <p className="student-muted student-credit-intro">Your purchased balances, kept separate by use. Confirmed purchases update here automatically.</p>
    {error?<div className="student-empty"><p className="student-error">We couldn’t load your credit balances.</p><button type="button" className="student-text-link" onClick={()=>setRetry(value=>value+1)}><RefreshCw size={14}/>Try again</button></div>:!ready?<p className="student-empty" role="status">Loading your credits…</p>:<StudentCreditDetails data={ready.data} now={now} cached={ready.cached}/>}
  </section>;
}

export function StudentCreditDetails({data,now,cached=false}:{data:Record<string,unknown>;now:number;cached?:boolean}) {
  const balances=studentCreditBalances(data,now);
  return <><div className="student-credit-grid">{balances.main.map(balance=><article className="student-credit-card" key={balance.id}><h3>{balance.label}</h3><strong>{balance.unlimited?'Unlimited':balance.paid.toLocaleString()}</strong><p>{balance.unlimited?`${balance.paid.toLocaleString()} paid credits kept in your balance`:'paid credits remaining'}{balance.free>0?` · ${balance.free} free available`:''}</p>{balance.expires&&<p>Plan active until {new Date(balance.expires).toLocaleDateString('en-GB')}</p>}<small>{balance.description}</small><Link href={balance.href}>{balance.id==='universal'?'Manage AI credits':balance.id==='pte-mock'?'PTE mocks & top up':'IELTS mocks & top up'}<ArrowRight size={14}/></Link></article>)}</div>
    {balances.additional.length>0&&<div className="student-credit-extra"><h3>Other credits you own</h3><p className="student-muted">Task-specific credits are shown separately and are not added to the shared balance above.</p><ul>{balances.additional.map(balance=><li key={balance.id}><span>{balance.label}</span><strong>{balance.unlimited?'Unlimited plan':`${balance.paid} credits`}</strong>{balance.unlimited&&balance.paid>0&&<small>{balance.paid} paid credits retained</small>}{balance.expires&&<small>Until {new Date(balance.expires).toLocaleDateString('en-GB')}</small>}</li>)}</ul></div>}
    <p className="student-muted student-credit-status" role="status">{cached?'Showing saved balances while reconnecting.':'Balances updated from your account.'} If you have just paid, allow the payment confirmation to arrive.</p>
  </>;
}
