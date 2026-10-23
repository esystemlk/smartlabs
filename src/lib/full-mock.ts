export const FULL_MOCK_ID = 'pte-full-mock-1';
export type Skill = 'overall' | 'listening' | 'reading' | 'speaking' | 'writing';
export const SKILLS: Skill[] = ['overall', 'listening', 'reading', 'speaking', 'writing'];
// User-supplied Pearson average weighting table. <1% entries use the approved 0.5% estimate.
// Columns are normalized independently because the published values are rounded.
export const FULL_WEIGHTS: Record<string, number[]> = {
  'read-aloud': [4,0,0,9,0], 'repeat-sentence': [7,17,0,16,0],
  'describe-image': [15,0,0,31,0], 'retell-lecture': [6,13,0,13,0],
  'answer-short-question': [2,4,0,0,0], 'summarize-group-discussion': [9,20,0,19,0],
  'respond-to-situation': [6,0,0,13,0], swt: [7,0,23,0,28], 'write-essay': [7,0,0,0,31],
  'rw-fill-blanks': [7,0,25,0,0], 'mcq-multiple': [1,0,5,0,0],
  'reorder-paragraphs': [3,0,9,0,0], 'fill-blanks': [6,0,20,0,0],
  'reading-mcq-single': [0.5,0,3,0,0], 'summarize-spoken-text': [4,10,0,0,18],
  'listening-mcq-multiple': [1,3,0,0,0], 'listening-fill-blanks': [3,8,0,0,0],
  'highlight-correct-summary': [0.5,2,3,0,0], 'listening-mcq-single': [0.5,2,0,0,0],
  'select-missing-word': [1,1,0,0,0], 'highlight-incorrect-words': [4,8,13,0,0],
  'write-from-dictation': [5,13,0,0,23],
};
export const FULL_TASKS = [
  ['read-aloud','Read Aloud',5,40,40], ['repeat-sentence','Repeat Sentence',10,0,15],
  ['describe-image','Describe Image',5,25,40], ['retell-lecture','Retell Lecture',3,10,40],
  ['answer-short-question','Answer Short Question',5,0,10],
  ['summarize-group-discussion','Summarize Group Discussion',2,10,120],
  ['respond-to-situation','Respond to a Situation',2,10,40],
  ['swt','Summarize Written Text',2,0,600], ['write-essay','Write Essay',1,0,1200],
  ['rw-fill-blanks','Fill in the Blanks · Dropdown',5,0,0], ['mcq-multiple','Multiple Choice · Multiple Answers',2,0,0],
  ['reorder-paragraphs','Reorder Paragraphs',2,0,0], ['fill-blanks','Fill in the Blanks · Drag & Drop',5,0,0],
  ['reading-mcq-single','Multiple Choice · Single Answer',2,0,0],
  ['summarize-spoken-text','Summarize Spoken Text',1,0,600], ['listening-mcq-multiple','Multiple Choice · Multiple Answers',2,0,0],
  ['listening-fill-blanks','Fill in the Blanks · Type In',2,0,0], ['highlight-correct-summary','Highlight Correct Summary',2,0,0],
  ['listening-mcq-single','Multiple Choice · Single Answer',2,0,0], ['select-missing-word','Select Missing Word',1,0,0],
  ['highlight-incorrect-words','Highlight Incorrect Words',2,0,0], ['write-from-dictation','Write from Dictation',3,0,0],
].map(([type,label,count,prepare,respond], i) => ({ type: String(type), label: String(label), count: Number(count), prepare: Number(prepare), respond: Number(respond), part: i < 9 ? 0 : i < 14 ? 1 : 2 }));
export const PARTS = [{ label: 'Speaking & Writing', seconds: 84*60 }, { label: 'Reading', seconds: 30*60 }, { label: 'Listening', seconds: 43*60 }];
export type FullAnswer = string | string[] | number[];
export interface FullScore { raw: number; max: number; percent: number; detail?: unknown }
export interface FullQuestion { id: string; type: string; part: number }
export interface FullAttempt {
  userId: string; status: 'in_progress' | 'submitted' | 'scored'; createdAt: number;
  current: number; questions: FullQuestion[]; partEndsAt: number; questionStartedAt: number;
  questionEndsAt: number; expiresAt: number; results?: Record<Skill, number>;
  scoredIndices?: number[];
}
export const speakingTask = (type: string) => FULL_TASKS.findIndex(t => t.type === type) < 7 && FULL_TASKS.some(t => t.type === type);
export function aggregateFullScores(rows: { type: string; score: FullScore }[]): Record<Skill, number> {
  const grouped = new Map<string, number[]>();
  rows.forEach(r => grouped.set(r.type, [...(grouped.get(r.type) || []), Math.max(0, Math.min(100, r.score.percent))]));
  return Object.fromEntries(SKILLS.map((skill, col) => {
    let sum = 0, weight = 0;
    for (const [type, values] of grouped) {
      const w = FULL_WEIGHTS[type]?.[col] || 0;
      sum += (values.reduce((a,b) => a+b,0)/values.length)*w;
      weight += w;
    }
    return [skill, Math.round(10 + (weight ? sum/weight : 0)*0.8)];
  })) as Record<Skill, number>;
}
const normalize = (s: unknown) => String(s ?? '').trim().toLowerCase();
export function scoreObjective(type: string, data: Record<string, any>, answer: FullAnswer): FullScore {
  const arr = Array.isArray(answer) ? answer : [answer];
  let raw = 0, max = 1;
  if (type === 'rw-fill-blanks' || type === 'fill-blanks' || type === 'listening-fill-blanks') {
    const correct: string[] = type === 'rw-fill-blanks' ? data.blanks.map((b: any) => b.correctAnswer) : data.correctWords;
    max = correct.length;
    raw = correct.filter((v,i) => normalize(v) === normalize(arr[i])).length;
  } else if (type === 'reorder-paragraphs') {
    max = data.paragraphs.length-1;
    const order = data.paragraphIds ? arr.map(id=>data.paragraphIds.indexOf(String(id))) : arr.map(Number);
    if (new Set(order).size === order.length && order.every(n => Number.isInteger(n) && n >= 0 && n < data.paragraphs.length)) {
      raw = order.slice(0,-1).filter((n,i) => order[i+1] === n+1).length;
    }
  } else if (type === 'mcq-multiple' || type === 'listening-mcq-multiple') {
    max = data.correctAnswers.length;
    raw = [...new Set(arr.map(String))].reduce((s,v) => s + (data.correctAnswers.includes(v) ? 1 : -1),0);
  } else if (type === 'highlight-incorrect-words') {
    const correct = data.transcript.map((word: string, i: number) => data.incorrectWords.includes(word) ? i : -1).filter((n: number) => n >= 0);
    max = correct.length;
    raw = [...new Set(arr.map(Number))].reduce((s,n) => s + (correct.includes(n) ? 1 : -1),0);
  } else {
    raw = String(answer) === String(data.correctSummaryId ?? data.correctAnswer) ? 1 : 0;
  }
  raw = Math.max(0,Math.min(max,raw));
  return { raw, max, percent: max ? raw/max*100 : 0 };
}
