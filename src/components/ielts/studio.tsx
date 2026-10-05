'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import { ArrowUpRight, ArrowRight, ChevronDown, Headphones, BookOpen, PenLine, Mic, Check, Clock3, Layers3, Sparkles } from 'lucide-react';
import { ieltsSkills } from '@/lib/ielts-catalog';
const icons = { listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic };
type ReadingTest = { n: number; title: string; desc: string };
type ReadingBook = { book: number; tests: ReadingTest[] };
const cambridgeReadingBooks: ReadingBook[] = [
  { book: 21, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, summary completion and matching people · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · table completion, True/False/Not Given, locating information, choose-two and summary completion · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, sentence completion and multiple choice · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · True/False/Not Given, flow-chart and notes completion, summary completion and multiple choice · answer review' },
  ] },
  { book: 20, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, locating information, matching people and summary completion · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, summary completion and choose-two · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, matching headings, choose-two and matching experts · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information and matching people · answer review' },
  ] },
  { book: 19, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, locating information, choose-two and summary completion · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, sentence completion and summary completion · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, locating information, sentence completion and matching experts · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, matching people and summary completion · answer review' },
  ] },
  { book: 18, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · sentence and table completion, True/False/Not Given, locating information and matching timber cuts · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, multiple choice and summary completion · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · locating information, summary completion, matching people and matching headings · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · locating information, choose-two, multiple choice, matching people and summary completion · answer review' },
  ] },
  { book: 17, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · sentence and notes completion, True/False/Not Given, locating information, choose-two and summary completion · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, matching researchers and multiple choice · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, choose-two and sentence completion · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · True/False/Not Given, table completion, locating information, summary completion and choose-two · answer review' },
  ] },
  { book: 16, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · True/False/Not Given, table completion, matching headings, choose-two, multiple choice and matching people · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · True/False/Not Given, summary completion, multiple choice and Yes/No/Not Given · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · True/False/Not Given, summary completion, locating information and choose-two · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · diagram labelling, True/False/Not Given, multiple choice, summary completion and matching headings · answer review' },
  ] },
  { book: 15, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · notes and table completion, locating information, choose-two, multiple choice and matching explorers · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · locating information, summary completion, matching people and multiple choice · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, matching headings, summary completion and sentence endings · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · notes and table completion, True/False/Not Given, summary completion and multiple choice · answer review' },
  ] },
  { book: 14, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · notes completion, locating information, choose-two and matching researchers · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · True/False/Not Given, notes completion, locating information, summary and matching headings · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · locating information, matching theories, choose-two and matching researchers · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · notes completion, True/False/Not Given, locating information, choose-two and multiple choice · answer review' },
  ] },
  { book: 13, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · table completion, True/False/Not Given, matching headings, matching people and sentence endings · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · notes completion, locating information, matching researchers, matching companies and sentence endings · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · table completion, matching researchers, summary completion and locating information · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · True/False/Not Given, sentence completion, sentence endings, locating information and multiple choice · answer review' },
  ] },
  { book: 12, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · True/False/Not Given, notes and sentence completion, matching headings and summary completion · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · locating information, matching people, choose-two, matching headings, table and sentence completion · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · matching headings, notes completion, locating information, summary completion and multiple choice · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · notes completion, multiple choice, summary completion and matching headings · answer review' },
  ] },
  { book: 11, tests: [
    { n: 1, title: 'Test 1', desc: 'Three passages · 40 questions · diagram labelling, completion and matching · answer review' },
    { n: 2, title: 'Test 2', desc: 'Three passages · 40 questions · True/False/Not Given, paragraph headings, diagram, summary and multiple choice · answer review' },
    { n: 3, title: 'Test 3', desc: 'Three passages · 40 questions · notes and sentence completion, sentence endings, section matching and True/False/Not Given · answer review' },
    { n: 4, title: 'Test 4', desc: 'Three passages · 40 questions · True/False/Not Given, matching researchers, multiple choice, matching headings and summary completion · answer review' },
  ] },
];
const cambridgeListeningBooks: ReadingBook[] = [
  { book: 14, tests: [
    { n: 1, title: 'Test 1', desc: 'Four parts · 40 questions · form completion, choose-two, matching, multiple choice and notes completion · audio + answer review' },
    { n: 2, title: 'Test 2', desc: 'Four parts · 40 questions · note completion, multiple choice, drag-and-drop plan labelling and matching · audio + answer review' },
    { n: 3, title: 'Test 3', desc: 'Four parts · 40 questions · note completion, choose-two, drag-and-drop matching and notes completion · audio + answer review' },
    { n: 4, title: 'Test 4', desc: 'Four parts · 40 questions · note completion, drag-and-drop matching, choose-two, multiple choice and notes completion · audio + answer review' },
  ] },
  { book: 13, tests: [
    { n: 1, title: 'Test 1', desc: 'Four parts · 40 questions · table completion, multiple choice, map labelling and flow-chart completion · audio + answer review' },
    { n: 2, title: 'Test 2', desc: 'Four parts · 40 questions · notes completion, multiple choice, choose-two and matching · audio + answer review' },
    { n: 3, title: 'Test 3', desc: 'Four parts · 40 questions · notes completion, matching, choose-two and multiple choice · audio + answer review' },
    { n: 4, title: 'Test 4', desc: 'Four parts · 40 questions · notes completion, multiple choice, matching and choose-two · audio + answer review' },
  ] },
  { book: 12, tests: [
    { n: 1, title: 'Test 1', desc: 'Four parts · 40 questions · notes completion, matching, choose-two and multiple choice · audio + answer review' },
    { n: 2, title: 'Test 2', desc: 'Four parts · 40 questions · notes completion, multiple choice, matching and flow-chart completion · audio + answer review' },
    { n: 3, title: 'Test 3', desc: 'Four parts · 40 questions · notes and table completion, choose-two, multiple choice and flow-chart completion · audio + answer review' },
    { n: 4, title: 'Test 4', desc: 'Four parts · 40 questions · notes and table completion, multiple choice, map labelling and matching · audio + answer review' },
  ] },
  { book: 11, tests: [
    { n: 1, title: 'Test 1', desc: 'Four parts · 40 questions · notes completion, map labelling and multiple choice · audio + answer review' },
    { n: 2, title: 'Test 2', desc: 'Four parts · 40 questions · notes completion, choose-two, plan labelling and multiple choice · audio + answer review' },
    { n: 3, title: 'Test 3', desc: 'Four parts · 40 questions · multiple choice, sentence and table completion, and matching · audio + answer review' },
    { n: 4, title: 'Test 4', desc: 'Four parts · 40 questions · table completion, matching, plan labelling, choose-two and multiple choice · audio + answer review' },
  ] },
];
let visitTrack = 'academic';
function readTrack() { try { return localStorage.getItem('ielts-track') || visitTrack; } catch { return visitTrack; } }
function subscribeTrack(callback: () => void) { window.addEventListener('storage', callback); window.addEventListener('ielts-track-change', callback); return () => { window.removeEventListener('storage', callback); window.removeEventListener('ielts-track-change', callback); }; }
export function IeltsStudio({ section }: { section?: string }) {
  const track = useSyncExternalStore(subscribeTrack, readTrack, () => 'academic');
  const [openBooks, setOpenBooks] = useState<Record<number, boolean>>({ 21: true });
  function toggleBook(book: number) { setOpenBooks(prev => ({ ...prev, [book]: !prev[book] })); }
  function chooseTrack(value: 'academic' | 'general') { visitTrack = value; try { localStorage.setItem('ielts-track', value); } catch { /* Keep the choice for this visit. */ } window.dispatchEvent(new Event('ielts-track-change')); }
  const skill = ieltsSkills.find(item => item.id === section);
  const isGeneral = track === 'general';
  const groups = skill?.id === 'writing' && isGeneral ? ['Task 1 · Letter', 'Task 2 · Essay'] : skill?.id === 'reading' && isGeneral ? ['Section 1 · Everyday reading', 'Section 2 · Workplace reading', 'Section 3 · Extended reading'] : skill?.groups;
  const types = skill?.id === 'writing' && isGeneral ? ['Formal letters', 'Semi-formal letters', 'Informal letters', 'Opinion essays', 'Discussion essays', 'Multi-part essays'] : skill?.types;
  const books = skill?.id === 'reading' && !isGeneral ? cambridgeReadingBooks : skill?.id === 'listening' ? cambridgeListeningBooks : null;
  const bookLabel = skill?.id === 'listening' ? 'Listening' : 'Academic Reading';
  return <div className="studio-wrap">
    <div className="studio-top"><Link href="/dashboard/ielts" className="studio-wordmark">IELTS <span>STUDIO</span><i /></Link><span className="studio-top-note">A little practice. A world of possibility.</span></div>
    <nav className="studio-nav" aria-label="IELTS sections">{[{ id: '', title: 'Overview' }, ...ieltsSkills, { id: 'mock-tests', title: 'Mock tests' }].map(item => <Link key={item.id} aria-current={(section || '') === item.id ? 'page' : undefined} href={`/dashboard/ielts${item.id ? `/${item.id}` : ''}`}>{item.title}</Link>)}</nav>
    <div className="studio-track-row"><span>YOUR STUDY PATH</span><div className="studio-track" role="group" aria-label="Test type"><button aria-pressed={!isGeneral} onClick={() => chooseTrack('academic')}>Academic</button><button aria-pressed={isGeneral} onClick={() => chooseTrack('general')}>General Training</button></div></div>
    {!section ? <>
      <section className="studio-hero"><div className="studio-hero-copy"><p className="studio-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Small steps.<br /><em>Wider horizons.</em></h1><p>A space to find your confidence in English. Explore the four skills and make your next study session count.</p><Link className="studio-primary" href="/ai-ielts-essay-practice">Practise Writing Task 2 <ArrowUpRight size={18} /></Link><span className="studio-caption"><span /> Essay practice available now</span></div><div className="studio-art"><Image src="/images/ielts/studio-hero-ielts-red.png" alt="" fill priority sizes="(max-width: 760px) 100vw, 50vw" /><div className="studio-art-label">LEARN WITH PURPOSE <span>✦</span></div></div></section>
      <div className="studio-section-title"><div><p className="studio-eyebrow">FOUR SKILLS. ONE JOURNEY.</p><h2>Where will you begin?</h2></div><span>Explore your practice spaces</span></div>
      <div className="studio-skills">{ieltsSkills.map((item, i) => { const Icon = icons[item.id]; return <Link href={`/dashboard/ielts/${item.id}`} key={item.id} className="studio-skill" style={{ '--skill-color': item.color, '--skill-tint': item.tint } as CSSProperties}><div className="studio-skill-top"><span className="studio-skill-icon"><Icon size={27} strokeWidth={1.5} /></span><span>0{i + 1}</span></div><h3>{item.title}</h3><p>{item.subtitle}</p><div className="studio-skill-bottom"><span>{item.id === 'writing' ? 'Task 2 available' : 'Preview the section'}</span><ArrowUpRight size={19} /></div></Link>; })}</div>
      <div className="studio-bottom-grid"><section className="studio-note"><span className="studio-eyebrow">A GOOD PLACE TO START</span><h2>One essay.<br />A clearer next step.</h2><p>Write a Task 2 response and explore AI feedback on your ideas, organisation, vocabulary and grammar.</p><Link href="/ai-ielts-essay-practice">Open the essay trainer <ArrowRight size={17} /></Link><small>AI feedback is a practice estimate. Scoring may require credits.</small></section><section className="studio-roadmap"><p className="studio-eyebrow">THE STUDIO IS GROWING</p><h2>More ways to practise, on the way.</h2><div><Check size={18} /><span><strong>Writing Task 2</strong>Available to practise today</span><b>LIVE</b></div><div><Layers3 size={18} /><span><strong>Skill question collections</strong>New practice is being prepared</span></div><div><Clock3 size={18} /><span><strong>Timed mock tests</strong>Coming after the skill collections</span></div></section></div>
    </> : skill ? <>
      <section className="studio-detail-hero" style={{ '--skill-color': skill.color, '--skill-tint': skill.tint } as CSSProperties}><p className="studio-eyebrow">{isGeneral ? 'GENERAL TRAINING' : 'ACADEMIC'} · {skill.title.toUpperCase()}</p><h1>{skill.subtitle}</h1><p>{skill.description}</p><span className="studio-detail-label">{skill.id === 'listening' || skill.id === 'speaking' ? 'Shared by Academic and General Training' : `${isGeneral ? 'General Training' : 'Academic'} practice path`}</span></section>
      <div className="studio-section-title"><div><p className="studio-eyebrow">YOUR PRACTICE COLLECTION</p><h2>{skill.title} sections</h2></div></div>
      {books ? <div className="studio-books">{books.map((group, gi) => { const open = !!openBooks[group.book]; return <section className="studio-book" key={group.book} data-open={open}>
        <button type="button" className="studio-book-header" aria-expanded={open} onClick={() => toggleBook(group.book)}>
          <span className="studio-book-title"><span className="studio-part-number">{String(books.length - gi).padStart(2, '0')}</span><h3>Cambridge IELTS {group.book} · {bookLabel}</h3>{gi === 0 && <span className="studio-book-badge">LATEST</span>}</span>
          <span className="studio-book-meta">{group.tests.length} test{group.tests.length === 1 ? '' : 's'} <ChevronDown className="studio-book-chevron" size={18} /></span>
        </button>
        {open && <div className="studio-book-tests">{group.tests.map(test => <section className="studio-subpart" key={test.n}><span className="studio-subpart-number">{String(test.n).padStart(2, '0')}</span><div><h4>{test.title}</h4><p>{test.desc}</p></div><Link className="studio-primary" href={`/dashboard/ielts/${skill.id}/cambridge-${group.book}-test-${test.n}`}>Start practice <ArrowUpRight size={16} /></Link></section>)}</div>}
      </section>; })}
      </div> : <div className="studio-parts">{groups?.map((group, i) => { const live = skill.id === 'writing' && i === 1; return <section className="studio-part" key={group}><span className="studio-part-number">0{i + 1}</span><div><h3>{group}</h3><p>{live ? 'Develop your essay and receive AI practice feedback.' : 'Questions for this section are being prepared.'}</p></div>{live ? <Link className="studio-primary" href="/ai-ielts-essay-practice">Start practice <ArrowUpRight size={16} /></Link> : <span className="studio-soon">Coming soon</span>}</section>; })}</div>}
      <section className="studio-types"><h2>What you’ll practise</h2><div>{types?.map(type => <span key={type}>{type}</span>)}</div><p>These are the planned practice categories. Question collections will appear here as they become available.</p></section>
      {skill.id !== 'writing' && !books && <section className="studio-empty"><Sparkles size={24} /><h2>Your next practice collection is on its way.</h2><p>While we prepare these questions, you can start building your writing confidence.</p><Link href="/ai-ielts-essay-practice">Try Writing Task 2 <ArrowRight size={17} /></Link></section>}
    </> : <section className="studio-empty studio-mock"><Clock3 size={38} /><p className="studio-eyebrow">IELTS MOCK TESTS</p><h1>Bring your skills together.</h1><p>Timed section tests and full practice tests are being prepared. They’ll appear here when the questions and review tools are ready.</p><span className="studio-soon">Coming soon</span><Link href="/dashboard/ielts/writing">Explore writing practice <ArrowRight size={17} /></Link></section>}
    <footer className="studio-footer"><span>SMARTLABS · IELTS STUDIO</span><span>Your pace. Your progress. Your next chapter.</span></footer>
  </div>;
}
