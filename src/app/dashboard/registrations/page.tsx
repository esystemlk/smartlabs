import { RegistrationRecords } from '@/components/dashboard/student-data';
import { StudentBreadcrumb, DashboardHero } from '@/components/dashboard/student-views';
export default function Page(){return <div className="student-page"><StudentBreadcrumb/><DashboardHero image="registrations" eyebrow="YOUR COURSE REGISTRATIONS" title="My registrations" text="Review your course registration references and payment status."/><section className="student-panel"><RegistrationRecords/></section></div>}
