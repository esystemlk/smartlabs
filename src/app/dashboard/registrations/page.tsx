import { RegistrationRecords } from '@/components/dashboard/student-data';
import { StudentBreadcrumb } from '@/components/dashboard/student-views';
export default function Page(){return <div className="student-page"><StudentBreadcrumb/><div className="student-page-heading"><span className="student-eyebrow">YOUR COURSE REGISTRATIONS</span><h1>My registrations</h1><p>Review your course registration references and payment status.</p></div><section className="student-panel"><RegistrationRecords/></section></div>}
