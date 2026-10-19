import { PracticeResults } from '@/components/dashboard/student-data';
import { StudentBreadcrumb } from '@/components/dashboard/student-views';
export default function Page(){return <div className="student-page"><StudentBreadcrumb/><div className="student-page-heading"><span className="student-eyebrow">YOUR PRACTICE HISTORY</span><h1>Practice results</h1><p>Review saved scores and feedback for each exam separately.</p></div><section className="student-panel"><PracticeResults/></section></div>}
