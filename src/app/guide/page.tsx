import type { Metadata } from 'next';
import { WebsiteGuide } from '@/components/guide/website-guide';
export const metadata: Metadata = { title: 'How to use SmartLabs | Student website guide', description: 'Step-by-step help with account creation, PTE and IELTS practice, course registrations, payments and results, with screenshots.' };
export default function GuidePage(){return <div className="px-4 sm:px-6"><WebsiteGuide/></div>}
