/**
 * PTE Write From Dictation (WFD) scoring engine — a verbatim port of the
 * website's `src/lib/wfd-scoring.ts`. WFD is deterministic exact word matching
 * (no AI, no cost), so the app scores it locally against the transcript from the
 * shared question bank. Keep in sync with the web copy.
 */

export interface WfdIncorrect { expected: string; actual: string }
export interface WfdMisspelled { expected: string; actual: string }
export interface WfdOrderError { expected: string; actual: string; position: number }

export type WfdTokenKind = 'correct' | 'missing' | 'incorrect' | 'misspelled' | 'extra' | 'order';
export interface WfdToken {
  kind: WfdTokenKind;
  expected?: string;
  actual?: string;
}

export interface WfdResult {
  officialTranscript: string;
  studentAnswer: string;
  totalWords: number;
  correctWords: number;
  missingWords: string[];
  incorrectWords: WfdIncorrect[];
  misspelledWords: WfdMisspelled[];
  extraWords: string[];
  wordOrderErrors: WfdOrderError[];
  accuracy: number;
  pteScore: number;
  feedback: string[];
  analysis: WfdToken[];
}

export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?:;"'’“”\-–—()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}

export function isMisspelling(expected: string, actual: string): boolean {
  if (expected === actual) return false;
  const d = levenshtein(expected, actual);
  const longer = Math.max(expected.length, actual.length);
  if (longer <= 3) return d === 1;
  return d <= 2 && d / longer <= 0.34;
}

type Op = 'match' | 'sub' | 'del' | 'ins';

function align(official: string[], student: string[]): { op: Op; o?: string; s?: string }[] {
  const n = official.length;
  const m = student.length;
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = official[i - 1] === student[j - 1];
      const subCost = same ? 0 : isMisspelling(official[i - 1], student[j - 1]) ? 0.6 : 1;
      d[i][j] = Math.min(d[i - 1][j - 1] + subCost, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }

  const ops: { op: Op; o?: string; s?: string }[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same = official[i - 1] === student[j - 1];
      const subCost = same ? 0 : isMisspelling(official[i - 1], student[j - 1]) ? 0.6 : 1;
      if (Math.abs(d[i][j] - (d[i - 1][j - 1] + subCost)) < 1e-9) {
        ops.push({ op: same ? 'match' : 'sub', o: official[i - 1], s: student[j - 1] });
        i--; j--; continue;
      }
    }
    if (i > 0 && Math.abs(d[i][j] - (d[i - 1][j] + 1)) < 1e-9) {
      ops.push({ op: 'del', o: official[i - 1] }); i--; continue;
    }
    ops.push({ op: 'ins', s: student[j - 1] }); j--;
  }
  return ops.reverse();
}

function detectOrderErrors(
  ops: { op: Op; o?: string; s?: string }[],
): { orderErrors: WfdOrderError[]; reorderedOfficial: Set<number>; reorderedStudent: Set<number>; transposed: Set<number> } {
  const missingIdx: number[] = [];
  const extraIdx: number[] = [];
  const subIdx: number[] = [];
  ops.forEach((op, idx) => {
    if (op.op === 'del') missingIdx.push(idx);
    if (op.op === 'ins') extraIdx.push(idx);
    if (op.op === 'sub') subIdx.push(idx);
  });

  const orderErrors: WfdOrderError[] = [];
  const reorderedOfficial = new Set<number>();
  const reorderedStudent = new Set<number>();
  const transposed = new Set<number>();

  for (const mi of missingIdx) {
    if (reorderedOfficial.has(mi)) continue;
    const word = ops[mi].o!;
    const match = extraIdx.find((ei) => !reorderedStudent.has(ei) && ops[ei].s === word);
    if (match !== undefined) {
      reorderedOfficial.add(mi);
      reorderedStudent.add(match);
      orderErrors.push({ expected: word, actual: word, position: mi });
    }
  }

  for (const i of subIdx) {
    if (transposed.has(i)) continue;
    const a = ops[i];
    const j = subIdx.find((k) => k > i && !transposed.has(k) && ops[k].o === a.s && ops[k].s === a.o);
    if (j !== undefined) {
      transposed.add(i);
      transposed.add(j);
      orderErrors.push({ expected: a.o!, actual: a.s!, position: i });
    }
  }

  return { orderErrors, reorderedOfficial, reorderedStudent, transposed };
}

export function scoreWfd(officialTranscript: string, studentAnswer: string): WfdResult {
  const official = normalize(officialTranscript);
  const student = normalize(studentAnswer);
  const totalWords = official.length;

  const ops = align(official, student);
  const { orderErrors, reorderedOfficial, reorderedStudent, transposed } = detectOrderErrors(ops);

  const analysis: WfdToken[] = [];
  const missingWords: string[] = [];
  const incorrectWords: WfdIncorrect[] = [];
  const misspelledWords: WfdMisspelled[] = [];
  const extraWords: string[] = [];
  let correctWords = 0;

  ops.forEach((op, idx) => {
    switch (op.op) {
      case 'match':
        correctWords++;
        analysis.push({ kind: 'correct', expected: op.o, actual: op.s });
        break;
      case 'sub':
        if (transposed.has(idx)) {
          analysis.push({ kind: 'order', expected: op.o, actual: op.s });
        } else if (isMisspelling(op.o!, op.s!)) {
          misspelledWords.push({ expected: op.o!, actual: op.s! });
          analysis.push({ kind: 'misspelled', expected: op.o, actual: op.s });
        } else {
          incorrectWords.push({ expected: op.o!, actual: op.s! });
          analysis.push({ kind: 'incorrect', expected: op.o, actual: op.s });
        }
        break;
      case 'del':
        if (!reorderedOfficial.has(idx)) missingWords.push(op.o!);
        analysis.push({ kind: 'missing', expected: op.o });
        break;
      case 'ins':
        if (!reorderedStudent.has(idx)) extraWords.push(op.s!);
        analysis.push({ kind: 'extra', actual: op.s });
        break;
    }
  });

  const accuracy = totalWords === 0 ? 0 : Math.round((correctWords / totalWords) * 10000) / 100;
  const pteScore = Math.round((accuracy * 90) / 100);

  return {
    officialTranscript,
    studentAnswer,
    totalWords,
    correctWords,
    missingWords,
    incorrectWords,
    misspelledWords,
    extraWords,
    wordOrderErrors: orderErrors,
    accuracy,
    pteScore,
    feedback: buildFeedback({ missingWords, incorrectWords, misspelledWords, extraWords, orderErrors, accuracy, correctWords, totalWords }),
    analysis,
  };
}

function buildFeedback(x: {
  missingWords: string[];
  incorrectWords: WfdIncorrect[];
  misspelledWords: WfdMisspelled[];
  extraWords: string[];
  orderErrors: WfdOrderError[];
  accuracy: number;
  correctWords: number;
  totalWords: number;
}): string[] {
  const f: string[] = [];
  x.missingWords.forEach((w) => f.push(`You missed the word "${w}".`));
  x.incorrectWords.forEach((w) => f.push(`You wrote "${w.actual}" — the correct word is "${w.expected}".`));
  x.misspelledWords.forEach((w) => f.push(`"${w.actual}" is misspelled. The correct spelling is "${w.expected}".`));
  x.extraWords.forEach((w) => f.push(`"${w}" is an extra word that is not in the original sentence.`));
  x.orderErrors.forEach((w) => f.push(`The word "${w.expected}" appears in the wrong position.`));

  if (x.accuracy === 100) {
    f.push('Perfect — every word matched the transcript exactly.');
  } else {
    if (x.missingWords.length) f.push('Try to write every word exactly as you hear it — missing words cost marks directly.');
    if (x.misspelledWords.length) f.push('Focus on spelling: every misspelled word loses a mark.');
    if (x.extraWords.length) f.push('Avoid adding words you did not hear.');
    if (x.orderErrors.length) f.push('Keep the words in the exact order you heard them.');
  }
  return f;
}

export function performanceSummary(r: WfdResult): string {
  const a = r.accuracy;
  if (a === 100) return 'Perfect score — every word was correct.';
  if (a >= 90) return 'Excellent. Only a small slip away from a perfect score.';
  if (a >= 80) return 'Very good. Tighten up spelling and missed words to push higher.';
  if (a >= 70) return 'Good attempt. Improving spelling and avoiding missing words will raise your score significantly.';
  if (a >= 50) return 'Fair. Focus on catching every word — try shorthand notes while listening.';
  return 'Keep practising. Listen for the sentence shape first, then fill in the details.';
}
