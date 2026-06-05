import type { PteSection } from '@/types/pte-question';

export interface PteTaskDef {
  taskType: string;
  label: string;
  /** Whether questions can be managed/added for this task yet */
  enabled: boolean;
}

export interface PteSectionDef {
  section: PteSection;
  label: string;
  enabled: boolean;
  tasks: PteTaskDef[];
}

/**
 * The full PTE task tree for the admin question bank.
 * Only Writing's two sub-parts are enabled for now; the rest are placeholders
 * until those trainers are rebuilt.
 */
export const PTE_TASK_TREE: PteSectionDef[] = [
  {
    section: 'writing',
    label: 'Writing',
    enabled: true,
    tasks: [
      { taskType: 'write-essay', label: 'Write Essay', enabled: true },
      { taskType: 'swt', label: 'Summarize Written Text', enabled: true },
    ],
  },
  {
    section: 'speaking',
    label: 'Speaking',
    enabled: false,
    tasks: [
      { taskType: 'read-aloud', label: 'Read Aloud', enabled: false },
      { taskType: 'repeat-sentence', label: 'Repeat Sentence', enabled: false },
      { taskType: 'describe-image', label: 'Describe Image', enabled: false },
      { taskType: 'retell-lecture', label: 'Re-tell Lecture', enabled: false },
      { taskType: 'answer-short-question', label: 'Answer Short Question', enabled: false },
    ],
  },
  {
    section: 'reading',
    label: 'Reading',
    enabled: false,
    tasks: [
      { taskType: 'rw-fill-blanks', label: 'R&W Fill in the Blanks', enabled: false },
      { taskType: 'mcq-multiple', label: 'MCQ Multiple Answer', enabled: false },
      { taskType: 'reorder-paragraphs', label: 'Re-order Paragraphs', enabled: false },
      { taskType: 'fill-blanks', label: 'Fill in the Blanks', enabled: false },
      { taskType: 'mcq-single', label: 'MCQ Single Answer', enabled: false },
    ],
  },
  {
    section: 'listening',
    label: 'Listening',
    enabled: false,
    tasks: [
      { taskType: 'summarize-spoken-text', label: 'Summarize Spoken Text', enabled: false },
      { taskType: 'write-from-dictation', label: 'Write from Dictation', enabled: false },
      { taskType: 'mcq-multiple', label: 'MCQ Multiple Answer', enabled: false },
      { taskType: 'fill-blanks', label: 'Fill in the Blanks', enabled: false },
      { taskType: 'highlight-correct-summary', label: 'Highlight Correct Summary', enabled: false },
    ],
  },
];

export function taskLabel(section: PteSection, taskType: string): string {
  const s = PTE_TASK_TREE.find(x => x.section === section);
  return s?.tasks.find(t => t.taskType === taskType)?.label ?? taskType;
}
