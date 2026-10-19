import { notFound } from 'next/navigation';
import { PTE_CATALOG } from '@/lib/pte-catalog';
import { PteDashboardView } from '@/components/dashboard/student-views';
export default async function Page({params}:{params:Promise<{skill:string}>}){const {skill}=await params;if(!PTE_CATALOG.some(item=>item.id===skill))notFound();return <PteDashboardView skill={skill}/>}
