import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, Headphones, Mic, PenLine, HelpCircle, ReceiptText, BarChart3 } from 'lucide-react';
import { PTE_CATALOG } from '@/lib/pte-catalog';
import { taskHref, type StudentExam } from '@/lib/student-navigation';

const skillIcons = { speaking: Mic, writing: PenLine, reading: BookOpen, listening: Headphones };
export function StudentBreadcrumb({ exam, skill }: { exam?: StudentExam; skill?: string }) {
  return <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">Home</Link>{exam && <><span aria-hidden="true">/</span><Link href={`/dashboard/${exam}`}>{exam === 'pte' ? 'PTE Academic' : 'IELTS'}</Link></>}{skill && <><span aria-hidden="true">/</span><span aria-current="page">{skill}</span></>}</nav>;
}
export function ExamFooter({ exam }: { exam: StudentExam }) {
  return <footer className={`student-exam-footer student-exam-${exam}`} style={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.65)),url('/images/student/${exam}-footer.webp')` }}>
    <div><span className="student-eyebrow">YOUR NEXT STEP</span><h2>A little practice. A clearer direction.</h2><p>Explore a skill, review your feedback, or find help with your registration.</p></div>
    <div className="student-footer-links"><Link href={`/dashboard/${exam}`}>{exam === 'pte' ? 'PTE Academic' : 'IELTS'} overview <ArrowRight size={16} /></Link><Link href="/dashboard/results">Practice results</Link><Link href="/dashboard/registrations">My registrations</Link><Link href="/dashboard/support">Get help</Link></div>
  </footer>;
}
export function StudentHomeView({ name, registrations, results, extra }: { name?: string; registrations?: ReactNode; results?: ReactNode; extra?: ReactNode }) {
  return <div className="student-page student-home"><div className="student-page-heading"><span className="student-eyebrow">YOUR STUDENT SPACE</span><h1>What would you like to practise?</h1><p>{name ? `Welcome, ${name.split(' ')[0]}. ` : ''}Choose your exam to find every practice section.</p></div>
    <div className="student-exam-choices" id="choose-exam">{(['pte', 'ielts'] as const).map(exam => <Link key={exam} href={`/dashboard/${exam}`} className={`student-exam-choice student-exam-${exam}`}>
      <img src={`/images/student/${exam}-hero.webp`} alt="" loading="eager" width={800} height={450} /><div className="student-exam-choice-copy"><span className="student-exam-badge">{exam === 'pte' ? 'PTE' : 'IELTS'}</span><h2>{exam === 'pte' ? 'PTE Academic' : 'IELTS'}</h2><p>{exam === 'pte' ? 'Speaking · Writing · Reading · Listening' : 'Listening · Reading · Writing · Speaking'}</p><span className="student-button">Open {exam === 'pte' ? 'PTE' : 'IELTS'} dashboard <ArrowRight size={17} /></span></div>
    </Link>)}</div>
    <div className="student-two-column"><section className="student-panel"><div className="student-section-heading"><h2><ReceiptText size={21} /> My registrations</h2><Link href="/dashboard/registrations">View all <ArrowRight size={15} /></Link></div><p className="student-muted">Track your course registrations and payment status.</p>{registrations ?? <Link className="student-text-link" href="/dashboard/registrations">View my registrations <ArrowRight size={16} /></Link>}</section><section className="student-panel"><div className="student-section-heading"><h2><BarChart3 size={21} /> Recent practice results</h2><Link href="/dashboard/results">View all <ArrowRight size={15} /></Link></div>{results ?? <p className="student-muted">Your completed practice results will appear here.</p>}</section></div>
    <section className="student-help-strip"><HelpCircle size={25} /><div><h2>Not sure where to start?</h2><p>Choose an exam above, then a skill. Courses on this website are available for registration.</p></div><Link className="student-button student-button-secondary" href="/courses">Register for a course <ArrowRight size={16} /></Link></section>{extra}
  </div>;
}
export function PteDashboardView({ skill }: { skill?: string }) {
  const section = PTE_CATALOG.find(section => section.id === skill);
  return <div className="student-page student-exam-pte"><StudentBreadcrumb exam="pte" skill={section?.label} />
    <section className="student-exam-hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(245,249,255,.99),rgba(245,249,255,.9) 45%,rgba(245,249,255,.12)),url('/images/student/pte-hero.webp')" }}>
      <div className="student-hero-copy"><span className="student-exam-badge">PTE ACADEMIC</span><h1>{section ? `${section.label} practice` : 'Your next score starts here.'}</h1><p>{section ? `Explore ${section.tasks.length} ${section.label.toLowerCase()} tasks. Choose the task you want to practise.` : 'Find every PTE skill in one place. Choose a section, pick a task, and build your confidence one response at a time.'}</p><Link className="student-text-link" href="/dashboard/ielts">Looking for IELTS? <ArrowRight size={16} /></Link></div>
    </section>
    <div className="student-section-heading"><h2>{section ? 'Choose a practice task' : 'Choose your skill'}</h2><span className="student-muted">{section ? 'Full task names. Direct practice links.' : `${PTE_CATALOG.reduce((sum, section) => sum + section.tasks.length, 0)} tasks across four skills`}</span></div>
    {section ? <div className="student-task-list">{section.tasks.map(task => { const href = taskHref(task); return <article className="student-task-row" key={task.taskType}><div><span className="student-eyebrow">{section.label}</span><h2>{task.label}</h2><p>{task.scoring === 'ai' ? 'Practise your response and receive AI practice feedback.' : 'Practise with automatic answer checking.'}</p></div>{href ? <Link className="student-button" href={href}>Start practice <ArrowRight size={16} /></Link> : <span className="student-status">Coming soon</span>}</article>; })}</div>
      : <div className="student-skill-grid">{PTE_CATALOG.map(section => { const Icon = skillIcons[section.id]; return <Link className="student-skill-card" href={`/dashboard/pte/${section.id}`} key={section.id}><span className={`student-skill-icon student-skill-${section.id}`}><Icon size={27} /></span><h2>{section.label}</h2><p>{section.tasks.slice(0, 2).map(task => task.label).join(' · ')}</p><span className="student-muted">{section.tasks.length} practice tasks</span><span className="student-card-action">Explore tasks <ArrowRight size={17} /></span></Link>; })}</div>}
    <section className="student-help-strip"><BookOpen size={24} /><div><h2>Keep your next step simple.</h2><p>Review your practice results or return to another skill. Practice scores are not official exam results.</p></div><Link className="student-button student-button-secondary" href="/dashboard/results">View results <ArrowRight size={16} /></Link></section><ExamFooter exam="pte" />
  </div>;
}
