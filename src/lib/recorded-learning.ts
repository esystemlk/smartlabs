import type { RecordedPackage } from '@/types/recorded-package';
export type RecordedExam = 'pte' | 'ielts' | 'both';
export const GRAMMAR_PACKAGE_ID = 'grammar-pack';
export const GRAMMAR_PRICE = 5000;
export const NO_ACCESS_EXPIRY = Date.UTC(9999,11,31);
export function grammarPackage(settings:Partial<RecordedPackage>={}):RecordedPackage & {id:string}{
  const otherTiers=settings.tiers?.length?settings.tiers.filter(t=>Number.isInteger(Number(t.months))&&Number(t.months)>=2&&Number(t.months)<=3&&Number.isFinite(Number(t.price))&&Number(t.price)>0):[{months:2,price:10000},{months:3,price:15000}];
  return {...settings,id:GRAMMAR_PACKAGE_ID,productType:'grammar',exam:'both',title:settings.title||'PTE & IELTS · Grammar Pack',description:settings.description||'The shared grammar video collection for PTE and IELTS. Included free with a qualifying recorded or normal course, or buy it separately.',includesGrammar:true,includesResources:true,price:GRAMMAR_PRICE,accessMonths:1,tiers:[{months:1,price:GRAMMAR_PRICE},...otherTiers],published:settings.published!==false,features:settings.features||['The same grammar videos for PTE and IELTS','Grammar study documents when provided','Included at no extra cost with a qualifying course']};
}
export type LearningItem = { id: string; title: string; kind: 'video' | 'document'; group: 'course' | 'grammar' | 'resources'; duration?: string; description?: string; order: number };
export type SharedLearningItem = LearningItem & { exam: RecordedExam; published: boolean; grammarResource?: boolean; packageId?: string; bunnyLibraryId?: string; bunnyVideoId?: string; storagePath?: string };
export function packageExam(pkg: Pick<RecordedPackage, 'exam' | 'title' | 'lmsCourseTitle'>): RecordedExam {
  return pkg.exam || (/ielts/i.test(`${pkg.title} ${pkg.lmsCourseTitle || ''}`) ? 'ielts' : 'pte');
}
export function itemBelongs(item: SharedLearningItem, pkg: RecordedPackage & { id: string }) {
  if (!item.published || (item.packageId && item.packageId !== pkg.id)) return false;
  const exam = packageExam(pkg);
  if (item.exam !== 'both' && exam !== 'both' && item.exam !== exam) return false;
  if(pkg.productType==='grammar')return item.group==='grammar'||(item.kind==='document'&&item.grammarResource===true);
  return item.group === 'grammar' ? true : pkg.includesResources !== false;
}
export function timestampMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const date = value as { toMillis?: () => number; toDate?: () => Date } | null;
  return date?.toMillis?.() ?? date?.toDate?.().getTime() ?? 0;
}
