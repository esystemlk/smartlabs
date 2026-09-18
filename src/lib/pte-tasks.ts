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
 * The full PTE task tree for the admin question bank. Every part is enabled:
 * the writing/listening text types (Essay, SWT, SST, WFD) use the inline form,
 * and the structured types (Speaking prompts, Reading & Listening interactive)
 * open the "Add questions — all parts" editor with the correct fields.
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
    enabled: true,
    tasks: [
      { taskType: 'read-aloud', label: 'Read Aloud', enabled: true },
      { taskType: 'repeat-sentence', label: 'Repeat Sentence', enabled: true },
      { taskType: 'describe-image', label: 'Describe Image', enabled: true },
      { taskType: 'retell-lecture', label: 'Re-tell Lecture', enabled: true },
      { taskType: 'answer-short-question', label: 'Answer Short Question', enabled: true },
      { taskType: 'summarize-group-discussion', label: 'Summarize Group Discussion', enabled: true },
      { taskType: 'respond-to-situation', label: 'Respond to a Situation', enabled: true },
    ],
  },
  {
    section: 'reading',
    label: 'Reading',
    enabled: true,
    tasks: [
      { taskType: 'rw-fill-blanks', label: 'R&W Fill in the Blanks', enabled: true },
      { taskType: 'mcq-multiple', label: 'MCQ Multiple Answer', enabled: true },
      { taskType: 'reorder-paragraphs', label: 'Re-order Paragraphs', enabled: true },
      { taskType: 'fill-blanks', label: 'Fill in the Blanks', enabled: true },
      { taskType: 'reading-mcq-single', label: 'MCQ Single Answer', enabled: true },
    ],
  },
  {
    section: 'listening',
    label: 'Listening',
    enabled: true,
    tasks: [
      { taskType: 'summarize-spoken-text', label: 'Summarize Spoken Text', enabled: true },
      { taskType: 'write-from-dictation', label: 'Write from Dictation', enabled: true },
      { taskType: 'listening-mcq-multiple', label: 'MCQ Multiple Answer', enabled: true },
      { taskType: 'listening-fill-blanks', label: 'Fill in the Blanks', enabled: true },
      { taskType: 'highlight-correct-summary', label: 'Highlight Correct Summary', enabled: true },
      { taskType: 'listening-mcq-single', label: 'MCQ Single Answer', enabled: true },
      { taskType: 'select-missing-word', label: 'Select Missing Word', enabled: true },
      { taskType: 'highlight-incorrect-words', label: 'Highlight Incorrect Words', enabled: true },
    ],
  },
];

export function taskLabel(section: PteSection, taskType: string): string {
  const s = PTE_TASK_TREE.find(x => x.section === section);
  return s?.tasks.find(t => t.taskType === taskType)?.label ?? taskType;
}
