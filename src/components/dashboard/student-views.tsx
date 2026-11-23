import {IeltsText} from '@/components/ielts/ielts-text';
import { RecordedLearningEntry } from '@/components/recorded-learning/entry';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, HelpCircle, ReceiptText, BarChart3 } from 'lucide-react';
import { PTE_CATALOG } from '@/lib/pte-catalog';
import { taskHref, type StudentExam } from '@/lib/student-navigation';
import { IELTS_URL } from '@/lib/constants';

/** Banner art made for the dashboard (public/images/dashboard/<name>.webp, plus -sm for phones). */
export type DashboardArt = 'home' | 'pte' | 'speaking' | 'writing' | 'reading' | 'listening' | 'results' | 'registrations' | 'recorded' | 'help';

/** Image hero bar used at the top of every student page. Text sits on the clear left side of the art. */
export function DashboardHero({ image, eyebrow, title, text, children }: { image: DashboardArt; eyebrow: string; title: ReactNode; text?: ReactNode; children?: ReactNode }) {
  const style = { '--dash-img': `url(/images/dashboard/${image}.webp)`, '--dash-img-sm': `url(/images/dashboard/${image}-sm.webp)` } as CSSProperties;
  return <section className="dash-hero" style={style}>
    <div className="dash-hero-copy"><span className="dash-eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}{children && <div className="dash-hero-actions">{children}</div>}</div>
  </section>;
}

/** 3D icon from the Smart Labs pack (public/icons/3d). */
const Icon3d = ({ name }: { name: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className="dash-icon" src={`/icons/3d/${name}.webp`} alt="" width={64} height={64} loading="lazy" />
);

const skillIcons: Record<string, string> = { speaking: 'speaking', writing: 'practice', reading: 'skimming', listening: 'listening' };
const skillTint: Record<string, string> = { speaking: 'blue', writing: 'yellow', reading: 'mint', listening: 'sky' };

export function StudentBreadcrumb({ exam, skill }: { exam?: StudentExam; skill?: string }) {
  return <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">Home</Link>{exam && <><span aria-hidden="true">/</span><Link href={`/dashboard/${exam}`}><IeltsText>{exam === 'pte' ? 'PTE Academic' : 'IELTS'}</IeltsText></Link></>}{skill && <><span aria-hidden="true">/</span><span aria-current="page">{skill}</span></>}</nav>;
}
export function ExamFooter({ exam }: { exam: StudentExam }) {
  return <footer className={`student-exam-footer student-exam-${exam}`} style={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.65)),url('/images/student/${exam}-footer.webp')` }}>
    <div><span className="student-eyebrow">YOUR NEXT STEP</span><h2>A little practice. A clearer direction.</h2><p>Explore a skill, review your feedback, or find help with your registration.</p></div>
    <div className="student-footer-links"><Link href={`/dashboard/${exam}`}><IeltsText>{exam === 'pte' ? 'PTE Academic' : 'IELTS'}</IeltsText> overview <ArrowRight size={16} /></Link><Link href="/dashboard/results">Practice results</Link><Link href="/dashboard/registrations">My registrations</Link><Link href="/dashboard/support">Get help</Link></div>
  </footer>;
}

const QUICK = [
  { label: 'Speaking', sub: 'Read aloud, repeat, describe', href: '/dashboard/pte/speaking', icon: 'speaking', tint: 'blue' },
  { label: 'Writing', sub: 'Essay & summaries', href: '/dashboard/pte/writing', icon: 'practice', tint: 'yellow' },
  { label: 'Reading', sub: 'Fill blanks, reorder, MCQ', href: '/dashboard/pte/reading', icon: 'skimming', tint: 'mint' },
  { label: 'Listening', sub: 'Dictation, summaries', href: '/dashboard/pte/listening', icon: 'listening', tint: 'sky' },
  { label: 'Mock tests', sub: 'Full timed PTE mocks', href: '/mock-tests', icon: 'mock-tests', tint: 'yellow' },
  { label: 'Recorded courses', sub: 'Watch your classes', href: '/dashboard/recorded-sessions', icon: 'recorded', tint: 'blue' },
  { label: 'Results', sub: 'Scores & feedback', href: '/dashboard/results', icon: 'results', tint: 'mint' },
  { label: 'Registrations', sub: 'Courses & payments', href: '/dashboard/registrations', icon: 'registrations', tint: 'sky' },
];

export function StudentHomeView({ name, registrations, results, extra, credits }: { name?: string; credits?: ReactNode; registrations?: ReactNode; results?: ReactNode; extra?: ReactNode }) {
  const first = name?.split(' ')[0];
  return <div className="student-page student-home">
    <DashboardHero image="home" eyebrow="YOUR STUDENT SPACE" title={`Welcome${first ? `, ${first}` : ''}`}
      text="Pick up where you left off: practise PTE tasks, check your results and manage your courses.">
      <Link className="dash-btn dash-btn-primary" href="/dashboard/pte">Start PTE practice <ArrowRight size={17} /></Link>
      <a className="dash-btn dash-btn-light" href={IELTS_URL} target="_blank" rel="noopener noreferrer">IELTS Studio <ArrowUpRight size={17} /></a>
    </DashboardHero>

    <section className="dash-section">
      <div className="student-section-heading"><h2>Quick start</h2><Link href="/dashboard/guide">New here? Website guide <ArrowRight size={15} /></Link></div>
      <div className="dash-tiles">{QUICK.map(q => <Link key={q.label} href={q.href} className={`dash-tile dash-tint-${q.tint}`}><Icon3d name={q.icon} /><b>{q.label}</b><small>{q.sub}</small></Link>)}</div>
    </section>

    <a className="dash-ielts" href={IELTS_URL} target="_blank" rel="noopener noreferrer">
      <Icon3d name="orbit-ielts" />
      <div><span className="dash-eyebrow">IELTS</span><h2>IELTS practice has moved to IELTS Studio</h2><p>Listening, Reading, Writing, Speaking and full IELTS mock tests are at ielts.smartlabs.lk.</p></div>
      <span className="dash-btn dash-btn-primary">Open IELTS Studio <ArrowUpRight size={17} /></span>
    </a>

    {credits}<RecordedLearningEntry/>
    <div className="student-two-column"><section className="student-panel"><div className="student-section-heading"><h2><ReceiptText size={21} /> My registrations</h2><Link href="/dashboard/registrations">View all <ArrowRight size={15} /></Link></div><p className="student-muted">Track your course registrations and payment status.</p>{registrations ?? <Link className="student-text-link" href="/dashboard/registrations">View my registrations <ArrowRight size={16} /></Link>}</section><section className="student-panel"><div className="student-section-heading"><h2><BarChart3 size={21} /> Recent practice results</h2><Link href="/dashboard/results">View all <ArrowRight size={15} /></Link></div>{results ?? <p className="student-muted">Your completed practice results will appear here.</p>}</section></div>
    <section className="student-help-strip"><HelpCircle size={25} /><div><h2>Not sure where to start?</h2><p>Take the free level test to find your level, or register for a course.</p></div><Link className="student-button student-button-secondary" href="/level-test">Free level test <ArrowRight size={16} /></Link><Link className="student-button student-button-secondary" href="/courses">Courses <ArrowRight size={16} /></Link></section>{extra}
  </div>;
}

export function PteDashboardView({ skill }: { skill?: string }) {
  const section = PTE_CATALOG.find(section => section.id === skill);
  return <div className="student-page student-exam-pte"><StudentBreadcrumb exam="pte" skill={section?.label} />
    <DashboardHero image={(section?.id as DashboardArt) ?? 'pte'} eyebrow="PTE ACADEMIC"
      title={section ? `${section.label} practice` : 'Your next score starts here.'}
      text={section ? `Explore ${section.tasks.length} ${section.label.toLowerCase()} tasks. Choose the task you want to practise.` : 'Find every PTE skill in one place. Choose a section, pick a task, and build your confidence one response at a time.'}>
      {!section && <a className="dash-btn dash-btn-light" href={IELTS_URL} target="_blank" rel="noopener noreferrer">Looking for IELTS? IELTS Studio <ArrowUpRight size={16} /></a>}
    </DashboardHero>
    {!section && <RecordedLearningEntry exam="pte"/>}
    <div className="student-section-heading"><h2>{section ? 'Choose a practice task' : 'Choose your skill'}</h2><span className="student-muted">{section ? 'Full task names. Direct practice links.' : `${PTE_CATALOG.reduce((sum, section) => sum + section.tasks.length, 0)} tasks across four skills`}</span></div>
    {section ? <div className="student-task-list">{section.tasks.map(task => { const href = taskHref(task); return <article className="student-task-row" key={task.taskType}><div><span className="student-eyebrow">{section.label}</span><h2>{task.label}</h2><p>{task.scoring === 'ai' ? 'Practise your response and receive AI practice feedback.' : 'Practise with automatic answer checking.'}</p></div>{href ? <Link className="student-button" href={href}>Start practice <ArrowRight size={16} /></Link> : <span className="student-status">Coming soon</span>}</article>; })}</div>
      : <div className="student-skill-grid">{PTE_CATALOG.map(section => <Link className={`student-skill-card dash-tint-${skillTint[section.id] ?? 'blue'}`} href={`/dashboard/pte/${section.id}`} key={section.id}><Icon3d name={skillIcons[section.id] ?? 'practice'} /><h2>{section.label}</h2><p>{section.tasks.slice(0, 2).map(task => task.label).join(' · ')}</p><span className="student-muted">{section.tasks.length} practice tasks</span><span className="student-card-action">Explore tasks <ArrowRight size={17} /></span></Link>)}</div>}
    <section className="student-help-strip"><BookOpen size={24} /><div><h2>Keep your next step simple.</h2><p>Review your practice results or return to another skill. Practice scores are not official exam results.</p></div><Link className="student-button student-button-secondary" href="/dashboard/results">View results <ArrowRight size={16} /></Link></section><ExamFooter exam="pte" />
  </div>;
}
