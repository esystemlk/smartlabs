import type { RecordedPackage } from '@/types/recorded-package';
export type RecordedExam = 'pte' | 'ielts' | 'both';
export type LearningItem = { id: string; title: string; kind: 'video' | 'document'; group: 'course' | 'grammar' | 'resources'; duration?: string; description?: string; order: number };
export type SharedLearningItem = LearningItem & { exam: RecordedExam; published: boolean; packageId?: string; bunnyLibraryId?: string; bunnyVideoId?: string; storagePath?: string };
export function packageExam(pkg: Pick<RecordedPackage, 'exam' | 'title' | 'lmsCourseTitle'>): RecordedExam {
  return pkg.exam || (/ielts/i.test(`${pkg.title} ${pkg.lmsCourseTitle || ''}`) ? 'ielts' : 'pte');
}
export function itemBelongs(item: SharedLearningItem, pkg: RecordedPackage & { id: string }) {
  if (!item.published || (item.packageId && item.packageId !== pkg.id)) return false;
  const exam = packageExam(pkg);
  if (item.exam !== 'both' && exam !== 'both' && item.exam !== exam) return false;
  return item.group === 'grammar' ? !!pkg.includesGrammar : pkg.includesResources !== false;
}
export function timestampMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const date = value as { toMillis?: () => number; toDate?: () => Date } | null;
  return date?.toMillis?.() ?? date?.toDate?.().getTime() ?? 0;
}
