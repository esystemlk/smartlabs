import { notFound } from 'next/navigation';
import { IeltsStudio } from '@/components/ielts/studio';
import { ieltsSkills } from '@/lib/ielts-catalog';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!ieltsSkills.some(skill => skill.id === section) && section !== 'mock-tests') notFound();
  return <IeltsStudio section={section} />;
}
