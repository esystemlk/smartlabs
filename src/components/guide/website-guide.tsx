'use client';
import {IeltsText} from '@/components/ielts/ielts-text';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BookOpen, Search, ChevronUp } from 'lucide-react';
import { guideSections } from '@/lib/student-guide';
import './website-guide.css';

export function WebsiteGuide() {
  const [search, setSearch] = useState('');
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const sections = guideSections.filter(section => words.every(word => `${section.title} ${section.intro} ${section.steps.join(' ')} ${section.note ?? ''}`.toLowerCase().includes(word)));
  return <div className="website-guide" id="guide-top">
    <header className="website-guide-hero">
      <span className="website-guide-eyebrow"><BookOpen size={16}/>THE SMARTLABS WEBSITE GUIDE</span>
      <h1>Your first visit.<br/><span>A clear next step.</span></h1>
      <p>From creating your account to finding PTE and IELTS practice, registering for a course and checking your results — follow the steps at your own pace.</p>
      <div className="website-guide-actions"><Link className="website-guide-primary" href="/dashboard">Open Student Home <ArrowRight size={17}/></Link><a href="#account" onClick={()=>setSearch('')}>Start with account creation <ArrowRight size={16}/></a></div>
      <div className="website-guide-facts"><span>10 short chapters</span><span>Desktop & mobile</span><span>Available without signing in</span></div>
    </header>
    <section className="website-guide-start" aria-labelledby="guide-start-title"><h2 id="guide-start-title">Just registered? Start here.</h2><ol><li><b>1</b><span>Open <Link href="/dashboard">Student Home</Link>.</span></li><li><b>2</b><span>Choose <Link href="/dashboard/pte">PTE</Link> or <Link href="/dashboard/ielts">IELTS</Link>.</span></li><li><b>3</b><span>Choose a skill, then an available practice task.</span></li></ol><p>Looking for a course instead? <Link href="/courses">Browse course registrations →</Link> Course registrations and practice credits are separate.</p></section>
    <div className="website-guide-tools"><label htmlFor="guide-search"><Search size={18}/><span className="sr-only">Search the website guide</span><input id="guide-search" type="search" placeholder="Search this guide: payment, IELTS, microphone…" value={search} onChange={event=>setSearch(event.target.value)}/></label><p aria-live="polite">{sections.length} {sections.length===1?'chapter':'chapters'}{search.trim()?' found':' to explore'}</p></div>
    <nav className="website-guide-chapters" aria-label="Guide chapters">{sections.map((section)=><a href={`#${section.id}`} key={section.id}><span>{String(guideSections.indexOf(section)+1).padStart(2,'0')}</span><IeltsText>{section.title}</IeltsText><ArrowRight size={16}/></a>)}</nav>
    {!sections.length && <div className="website-guide-empty"><h2>No matching chapters</h2><p>Try a shorter word such as “payment”, “writing” or “account”.</p><button onClick={()=>setSearch('')}>Show all chapters</button></div>}
    <p className="website-guide-screen-note">Screen examples show the website layout without personal student data. Your account records, available tests and seasonal colours may look different. Select a screenshot to see the larger image.</p>
    <div className="website-guide-sections">{sections.map(section=><section className="website-guide-section" id={section.id} key={section.id} aria-labelledby={`guide-title-${section.id}`}>
      <div className="website-guide-section-title"><span>{String(guideSections.indexOf(section)+1).padStart(2,'0')}</span><div><h2 id={`guide-title-${section.id}`}><IeltsText>{section.title}</IeltsText></h2><p>{section.intro}</p></div></div>
      <ol className="website-guide-steps">{section.steps.map((step,index)=><li key={step}><b>{index+1}</b><p>{step}</p></li>)}</ol>
      {section.note && <aside className="website-guide-note"><strong>Good to know</strong><p>{section.note}</p></aside>}
      {section.image && <figure className={section.id==='mobile'?'website-guide-mobile-image':undefined}><a href={section.image.src} target="_blank" rel="noopener noreferrer" aria-label={`View larger screenshot: ${section.title}`}><img src={section.image.src} alt={section.image.alt} width={section.image.width} height={section.image.height} loading="lazy"/></a><figcaption>{section.image.caption}</figcaption></figure>}
      <div className="website-guide-section-links">{section.links.map(link=><Link key={link.href} href={link.href}><IeltsText>{link.label}</IeltsText><ArrowRight size={15}/></Link>)}</div><a href="#guide-top" className="website-guide-back"><ChevronUp size={15}/>Back to guide contents</a>
    </section>)}</div>
    <footer className="website-guide-end"><BookOpen size={28}/><h2>You don’t have to remember everything.</h2><p>Save this page or open More → Website guide whenever you need a hand.</p><div className="website-guide-actions"><Link className="website-guide-primary" href="/dashboard">Go to Student Home <ArrowRight size={17}/></Link><Link href="/contact">Ask the SmartLabs team <ArrowRight size={16}/></Link></div></footer>
  </div>;
}
