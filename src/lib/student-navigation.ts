import { ALL_PTE_TASKS, PTE_CATALOG, type PteTask } from './pte-catalog';

export type StudentExam = 'pte' | 'ielts';
export const studentNav = [
  { label: 'Home', href: '/dashboard', icon: 'home' },
  { label: 'PTE Academic', href: '/dashboard/pte', icon: 'pte' },
  { label: 'IELTS', href: '/dashboard/ielts', icon: 'ielts' },
  { label: 'My Registrations', href: '/dashboard/registrations', icon: 'registrations' },
  { label: 'Results', href: '/dashboard/results', icon: 'results' },
  { label: 'Help', href: '/dashboard/support', icon: 'help' },
] as const;
export const taskHref = (task: PteTask) => task.built && task.builtHref ? task.builtHref : null;
export function examContext(pathname: string): { exam: StudentExam; skill?: string } | null {
  if (pathname.startsWith('/dashboard/ielts') || pathname === '/ai-ielts-essay-practice') return { exam: 'ielts', skill: pathname === '/ai-ielts-essay-practice' ? 'writing' : pathname.split('/')[3] };
  const task = ALL_PTE_TASKS.find(task => task.builtHref === pathname || `/dashboard/practice/${task.slug}` === pathname);
  if (task) return { exam: 'pte', skill: task.section };
  if (pathname.startsWith('/dashboard/pte')) return { exam: 'pte', skill: pathname.split('/')[3] };
  if (pathname.startsWith('/dashboard/ai-score-test')) return { exam: 'pte', skill: 'writing' };
  return null;
}
export const examHome = (exam: StudentExam) => exam === 'pte' ? '/dashboard/pte' : '/dashboard/ielts';
export const legacyStudentDestinations: Record<string, string> = {
  '/dashboard/ai-score-test': '/dashboard/pte',
  '/dashboard/ai-score-test/writing': '/dashboard/pte/writing',
  '/dashboard/practice-tests': '/dashboard',
  '/dashboard/progress': '/dashboard/results',
};
export const studentSearchItems = [
  ...PTE_CATALOG.flatMap(section => [
    { label: section.label, context: 'PTE Academic', href: `/dashboard/pte/${section.id}`, aliases: section.id },
    ...section.tasks.filter(task => taskHref(task)).map(task => ({ label: task.label, context: `PTE Academic · ${section.label}`, href: taskHref(task)!, aliases: `${task.taskType} ${task.slug} ${task.taskType === 'swt' ? 'SWT summarize written text' : task.taskType === 'wfd' ? 'WFD write from dictation' : task.taskType === 'sst' ? 'SST summarize spoken text' : task.taskType === 'read-aloud' ? 'RA' : ''}` })),
  ]),
  ...['listening', 'reading', 'writing', 'speaking'].map(skill => ({ label: skill.charAt(0).toUpperCase() + skill.slice(1), context: `IELTS${skill === 'speaking' ? ' · Coming soon' : ''}`, href: `/dashboard/ielts/${skill}`, aliases: skill })),
  { label: 'Writing Task 2', context: 'IELTS · Writing', href: '/ai-ielts-essay-practice', aliases: 'essay task2 task 2' },
  { label: 'Mock tests', context: 'IELTS · Listening, Reading & Writing', href: '/dashboard/ielts/mock-tests', aliases: 'mock timed' },
];
export function searchStudentTasks(value: string) {
  const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return studentSearchItems.filter(item => words.every(word => `${item.label} ${item.context} ${item.aliases}`.toLowerCase().includes(word))).slice(0, 12);
}
