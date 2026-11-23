import { PracticeResults } from '@/components/dashboard/student-data';
import { StudentBreadcrumb, DashboardHero } from '@/components/dashboard/student-views';
import Link from 'next/link';
export default function Page(){return <div className="student-page"><StudentBreadcrumb/><DashboardHero image="results" eyebrow="YOUR PRACTICE HISTORY" title="Practice results" text="Review saved scores and feedback for each exam separately."><Link href="/dashboard/speaking-recordings" className="dash-btn dash-btn-light">Listen to my speaking recordings →</Link></DashboardHero><section className="student-panel"><PracticeResults/></section></div>}
