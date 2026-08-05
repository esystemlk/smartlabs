/**
 * The single source of truth for every PTE Academic question type — the
 * "PTE catalogue". The mega-menu, the practice pages, the admin question bank
 * and search all read from this so the task list stays consistent everywhere.
 *
 * `scoring` is the important flag:
 *   - 'ai'   → an open-ended response an AI model marks against the Pearson
 *              criteria (speaking audio, or written essay/summary).
 *   - 'auto' → deterministic rule-based marking (MCQ, fill-blanks, reorder,
 *              dictation word-match) — no LLM needed.
 *
 * `built` = a real trainer page exists today (do NOT change those flows).
 * `weight` mirrors the official contribution each task makes to the score.
 */

export type PteSectionId = 'speaking' | 'writing' | 'reading' | 'listening';
export type PteScoring = 'ai' | 'auto';
/** Which skills a task's score feeds (enabling/hint only — informational). */

export interface PteTask {
  taskType: string;         // stable id, e.g. 'read-aloud'
  label: string;            // display name
  slug: string;             // route under /dashboard/practice/<slug>
  scoring: PteScoring;      // 'ai' | 'auto'
  weight: string;           // e.g. '15%', '<1%'
  isNew?: boolean;          // shows the "New" badge
  built?: boolean;          // a live trainer already exists
  builtHref?: string;       // where the live trainer lives, if built
  /** Input modality — drives what the practice page renders. */
  input: 'mic' | 'text' | 'choice' | 'order' | 'blank';
  /** Cycled theme colour (a tailwind hue) used to theme this task's page/menu. */
  color: string;
}

export interface PteSectionDef {
  id: PteSectionId;
  label: string;
  /** Base section colour (matches the dashboard). */
  color: string;
  tasks: PteTask[];
}

// Per-task colours cycle through this palette so every page feels distinct
// (the same idea as the old AI trainers each having their own accent).
export const PTE_COLOR_CYCLE = ['orange', 'violet', 'blue', 'emerald', 'rose', 'amber', 'cyan', 'indigo', 'teal', 'fuchsia', 'sky', 'lime'];

export const PTE_CATALOG: PteSectionDef[] = [
  {
    id: 'speaking', label: 'Speaking', color: 'blue',
    tasks: [
      { taskType: 'read-aloud',           label: 'Read Aloud',              slug: 'read-aloud',           scoring: 'ai', weight: '4%',  built: true, input: 'mic',  color: 'orange' },
      { taskType: 'repeat-sentence',      label: 'Repeat Sentence',         slug: 'repeat-sentence',      scoring: 'ai', weight: '7%',  built: true, input: 'mic',  color: 'violet' },
      { taskType: 'describe-image',       label: 'Describe Image',          slug: 'describe-image',       scoring: 'ai', weight: '15%', built: true, input: 'mic',  color: 'blue' },
      { taskType: 'retell-lecture',       label: 'Retell Lecture',          slug: 'retell-lecture',       scoring: 'ai', weight: '6%',  built: true, input: 'mic',  color: 'emerald' },
      { taskType: 'answer-short-question',label: 'Answer Short Question',   slug: 'answer-short-question',scoring: 'ai', weight: '2%',  built: true, input: 'mic',  color: 'rose' },
      { taskType: 'summarize-group-discussion', label: 'Summarize Group Discussion', slug: 'summarize-group-discussion', scoring: 'ai', weight: '9%', isNew: true, input: 'mic', color: 'amber' },
      { taskType: 'respond-to-situation', label: 'Respond to a Situation',  slug: 'respond-to-situation', scoring: 'ai', weight: '6%',  isNew: true, input: 'mic', color: 'cyan' },
    ],
  },
  {
    id: 'writing', label: 'Writing', color: 'violet',
    tasks: [
      { taskType: 'swt',         label: 'Summarize Written Text', slug: 'summarize-written-text', scoring: 'ai', weight: '7%', built: true, builtHref: '/swt-trainer',       input: 'text', color: 'violet' },
      { taskType: 'write-essay', label: 'Write Essay',            slug: 'write-essay',            scoring: 'ai', weight: '7%', built: true, builtHref: '/ai-essay-practice', input: 'text', color: 'orange' },
    ],
  },
  {
    id: 'reading', label: 'Reading', color: 'emerald',
    tasks: [
      { taskType: 'rw-fill-blanks',      label: 'Fill in the Blanks (R&W)',       slug: 'rw-fill-in-the-blanks',   scoring: 'auto', weight: '7%',   input: 'blank',  color: 'emerald' },
      { taskType: 'mcq-multiple',        label: 'Multiple Choice (Multiple)',     slug: 'reading-mcq-multiple',    scoring: 'auto', weight: '1%',   input: 'choice', color: 'teal' },
      { taskType: 'reorder-paragraphs',  label: 'Re-order Paragraphs',            slug: 'reorder-paragraphs',      scoring: 'auto', weight: '3%',   input: 'order',  color: 'lime' },
      { taskType: 'fill-blanks',         label: 'Fill in the Blanks (Drag & Drop)', slug: 'fill-in-the-blanks',    scoring: 'auto', weight: '6%',   input: 'blank',  color: 'green' },
      { taskType: 'reading-mcq-single',  label: 'Multiple Choice (Single)',       slug: 'reading-mcq-single',      scoring: 'auto', weight: '<1%',  input: 'choice', color: 'sky' },
    ],
  },
  {
    id: 'listening', label: 'Listening', color: 'orange',
    tasks: [
      { taskType: 'sst',                     label: 'Summarize Spoken Text',       slug: 'summarize-spoken-text', scoring: 'ai',   weight: '4%',  built: true, builtHref: '/ai-sst-practice', input: 'text',   color: 'orange' },
      { taskType: 'wfd',                     label: 'Write from Dictation',        slug: 'write-from-dictation',  scoring: 'auto', weight: '5%',  built: true, builtHref: '/ai-wfd-practice', input: 'text',   color: 'amber' },
      { taskType: 'listening-mcq-multiple',  label: 'Multiple Choice (Multiple)',  slug: 'listening-mcq-multiple',scoring: 'auto', weight: '1%',  input: 'choice', color: 'rose' },
      { taskType: 'listening-fill-blanks',   label: 'Fill in the Blanks',          slug: 'listening-fill-in-the-blanks', scoring: 'auto', weight: '3%', input: 'blank', color: 'indigo' },
      { taskType: 'highlight-correct-summary', label: 'Highlight Correct Summary', slug: 'highlight-correct-summary', scoring: 'auto', weight: '<1%', input: 'choice', color: 'cyan' },
      { taskType: 'listening-mcq-single',    label: 'Multiple Choice (Single)',    slug: 'listening-mcq-single',  scoring: 'auto', weight: '<1%', input: 'choice', color: 'fuchsia' },
      { taskType: 'select-missing-word',     label: 'Select Missing Word',         slug: 'select-missing-word',   scoring: 'auto', weight: '1%',  input: 'choice', color: 'sky' },
      { taskType: 'highlight-incorrect-words',label: 'Highlight Incorrect Words',  slug: 'highlight-incorrect-words', scoring: 'auto', weight: '4%', input: 'choice', color: 'violet' },
    ],
  },
];

/** Flat list of every task with its section id attached. */
export const ALL_PTE_TASKS = PTE_CATALOG.flatMap(s => s.tasks.map(t => ({ ...t, section: s.id })));

export const getTaskBySlug = (slug: string) => ALL_PTE_TASKS.find(t => t.slug === slug);
export const getTaskByType = (taskType: string) => ALL_PTE_TASKS.find(t => t.taskType === taskType);

export const aiTasks = () => ALL_PTE_TASKS.filter(t => t.scoring === 'ai');
export const autoTasks = () => ALL_PTE_TASKS.filter(t => t.scoring === 'auto');
