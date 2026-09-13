import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackLink, slate, tint } from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQ = any;

type Variant = 'dropdown' | 'dragdrop' | 'mcma' | 'mcsa' | 'reorder';
const VARIANT: Record<string, Variant> = {
  'rw-fill-blanks': 'dropdown',
  'fill-blanks': 'dragdrop',
  'mcq-multiple': 'mcma',
  'reading-mcq-single': 'mcsa',
  'reorder-paragraphs': 'reorder',
};
const SUBTITLE: Record<Variant, string> = {
  dropdown: 'Choose the best word for each blank from the dropdowns.',
  dragdrop: 'Fill each blank with the correct word from the bank.',
  mcma: 'Select all the answers that apply.',
  mcsa: 'Choose the single best answer.',
  reorder: 'Put the paragraphs in the correct order.',
};

interface Progress { answered: boolean; allCorrect: boolean }
type ReportFn = (r: Progress) => void;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function ReadingTrainer({ task, question, accent, onBack }: TrainerProps) {
  const variant = VARIANT[task.taskType] ?? 'mcsa';
  const [submitted, setSubmitted] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [progress, setProgress] = useState<Progress>({ answered: false, allCorrect: false });
  const [resetToken, setResetToken] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const graded = submitted || peeked;

  useEffect(() => {
    if (graded) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [graded, resetToken]);

  const resetAttempt = useCallback(() => {
    setSubmitted(false); setPeeked(false);
    setProgress({ answered: false, allCorrect: false });
    setElapsed(0); setResetToken((n) => n + 1);
  }, []);

  const onReport = useCallback((r: Progress) => setProgress(r), []);
  const attemptKey = `${question?.id}-${resetToken}`;

  return (
    <View style={{ gap: 14 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <BackLink label="All items" onPress={onBack} accent={accent} />
          <Text style={[styles.title, { color: accent }]}>{task.label}</Text>
          <Text style={styles.subtitle}>{SUBTITLE[variant]}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6, marginTop: 22 }}>
          <View style={[styles.pill, { backgroundColor: slate[100] }]}>
            <Ionicons name="time-outline" size={13} color={slate[600]} />
            <Text style={[styles.pillText, { color: slate[700] }]}>{fmt(elapsed)}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: tint(accent, 0.12) }]}>
            <Text style={[styles.pillText, { color: accent }]}>{task.weight}</Text>
          </View>
        </View>
      </View>

      {/* Question card */}
      <View style={styles.card}>
        {variant === 'dropdown' && <DropdownFIB key={attemptKey} q={question} graded={graded} accent={accent} onReport={onReport} />}
        {variant === 'dragdrop' && <DragDropFIB key={attemptKey} q={question} graded={graded} accent={accent} onReport={onReport} />}
        {variant === 'mcma' && <MultiChoice key={attemptKey} q={question} multi graded={graded} accent={accent} onReport={onReport} />}
        {variant === 'mcsa' && <MultiChoice key={attemptKey} q={question} multi={false} graded={graded} accent={accent} onReport={onReport} />}
        {variant === 'reorder' && <ReorderQ key={attemptKey} q={question} graded={graded} accent={accent} onReport={onReport} />}

        {submitted && (
          <View style={[styles.banner, progress.allCorrect ? styles.bannerGood : styles.bannerBad]}>
            <Ionicons name={progress.allCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={progress.allCorrect ? slate.emerald : slate.red} />
            <Text style={[styles.bannerText, { color: progress.allCorrect ? '#166534' : '#991B1B' }]}>
              {progress.allCorrect ? 'Correct — well done!' : 'Not quite — the correct answer is highlighted.'}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      {!graded ? (
        <View style={styles.controls}>
          <Pressable onPress={() => setSubmitted(true)} disabled={!progress.answered} style={[styles.primaryBtn, { backgroundColor: accent }, !progress.answered && { opacity: 0.4 }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Submit Answer</Text>
          </Pressable>
          <Pressable onPress={() => setPeeked(true)} style={styles.outlineBtn}>
            <Ionicons name="eye" size={16} color={slate[700]} />
            <Text style={styles.outlineBtnText}>See Answer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.controls}>
          <Pressable onPress={resetAttempt} style={[styles.primaryBtn, { backgroundColor: accent }]}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </Pressable>
          <Pressable onPress={onBack} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Practise Another</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ── Fill in the Blanks (R&W) — dropdown per blank ─────────────────────── */
function DropdownFIB({ q, graded, accent, onReport }: { q: AnyQ; graded: boolean; accent: string; onReport: ReportFn }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [openBlank, setOpenBlank] = useState<AnyQ | null>(null);
  const parts: string[] = String(q.passage).split(/\{\d+\}/);

  useEffect(() => {
    const answered = q.blanks.every((b: AnyQ) => picked[b.id]);
    const allCorrect = q.blanks.every((b: AnyQ) => picked[b.id] === b.correctAnswer);
    onReport({ answered, allCorrect });
  }, [picked, q.blanks, onReport]);

  return (
    <View style={styles.passageBox}>
      <Text style={styles.passageText}>
        {parts.map((part, i) => {
          const blank = q.blanks[i];
          const val = blank ? picked[blank.id] : undefined;
          const correct = graded && blank && val === blank.correctAnswer;
          const wrong = graded && blank && val && val !== blank.correctAnswer;
          return (
            <Text key={i}>
              {part}
              {blank ? (
                <Text>
                  <Text
                    onPress={graded ? undefined : () => setOpenBlank(blank)}
                    style={[styles.blankInline,
                      !!val && !graded && { color: accent, borderColor: accent },
                      correct && styles.blankGood,
                      wrong && styles.blankBad]}
                  >
                    {' '}{val || 'Select…'}{' '}
                  </Text>
                  {wrong ? <Text style={styles.correctInline}> ({blank.correctAnswer}) </Text> : null}
                </Text>
              ) : null}
            </Text>
          );
        })}
      </Text>

      <Modal visible={!!openBlank} transparent animationType="fade" onRequestClose={() => setOpenBlank(null)}>
        <Pressable style={styles.modalBg} onPress={() => setOpenBlank(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose a word</Text>
            {openBlank?.options.map((o: string) => (
              <Pressable key={o} style={styles.modalOpt} onPress={() => { setPicked((s) => ({ ...s, [openBlank.id]: o })); setOpenBlank(null); }}>
                <Text style={styles.modalOptText}>{o}</Text>
                {picked[openBlank.id] === o ? <Ionicons name="checkmark" size={18} color={accent} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── Fill in the Blanks (Drag & Drop) — tap a word to place it ─────────── */
function DragDropFIB({ q, graded, accent, onReport }: { q: AnyQ; graded: boolean; accent: string; onReport: ReportFn }) {
  const [bank, setBank] = useState<string[]>(() => shuffle([...q.correctWords, ...q.extraWords]));
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(q.correctWords.length).fill(null));
  const parts: string[] = String(q.passage).split('{BLANK}');

  useEffect(() => {
    const answered = answers.every((a) => a !== null);
    const allCorrect = answers.every((a, i) => a === q.correctWords[i]);
    onReport({ answered, allCorrect });
  }, [answers, q.correctWords, onReport]);

  const placeWord = (word: string, bankIdx: number) => {
    if (graded) return;
    const empty = answers.findIndex((a) => a === null);
    if (empty === -1) return;
    setAnswers((a) => { const n = [...a]; n[empty] = word; return n; });
    setBank((b) => b.filter((_, i) => i !== bankIdx));
  };
  const removeWord = (blankIdx: number) => {
    if (graded) return;
    const word = answers[blankIdx];
    if (!word) return;
    setAnswers((a) => { const n = [...a]; n[blankIdx] = null; return n; });
    setBank((b) => [...b, word]);
  };

  return (
    <View>
      <View style={styles.passageBox}>
        <Text style={styles.passageText}>
          {parts.map((part, i) => {
            const val = answers[i];
            const correct = graded && val === q.correctWords[i];
            const wrong = graded && val !== q.correctWords[i];
            return (
              <Text key={i}>
                {part}
                {i < parts.length - 1 ? (
                  <Text
                    onPress={graded ? undefined : () => removeWord(i)}
                    style={[styles.blankInline,
                      !!val && !graded && { color: accent, borderColor: accent },
                      correct && styles.blankGood,
                      wrong && styles.blankBad]}
                  >
                    {' '}{val || '______'}{' '}
                  </Text>
                ) : null}
              </Text>
            );
          })}
        </Text>
      </View>
      {graded ? (
        <View style={styles.answerNote}>
          <Text style={styles.answerNoteLabel}>Correct words: </Text>
          <Text style={styles.answerNoteVal}>{q.correctWords.join(' · ')}</Text>
        </View>
      ) : (
        <View style={styles.bankBox}>
          <Text style={styles.bankLabel}>WORD BANK</Text>
          <View style={styles.bankRow}>
            {bank.map((w, i) => (
              <Pressable key={`${w}-${i}`} style={styles.bankChip} onPress={() => placeWord(w, i)}>
                <Text style={styles.bankChipText}>{w}</Text>
              </Pressable>
            ))}
            {bank.length === 0 ? <Text style={styles.hint}>All words placed — tap a filled blank to release it.</Text> : null}
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Multiple choice (single / multiple) ───────────────────────────────── */
function MultiChoice({ q, multi, graded, accent, onReport }: { q: AnyQ; multi: boolean; graded: boolean; accent: string; onReport: ReportFn }) {
  const correctSet = useMemo<Set<string>>(() => new Set(multi ? q.correctAnswers : [q.correctAnswer]), [q, multi]);
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    const answered = sel.size > 0;
    const allCorrect = sel.size === correctSet.size && [...sel].every((x) => correctSet.has(x));
    onReport({ answered, allCorrect });
  }, [sel, correctSet, onReport]);

  const toggle = (opt: string) => {
    if (graded) return;
    setSel((prev) => {
      if (!multi) return new Set([opt]);
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt); else n.add(opt);
      return n;
    });
  };

  return (
    <View>
      {q.passage ? <Text style={[styles.passageBox, styles.passageText]}>{q.passage}</Text> : null}
      <Text style={styles.question}>{q.question}</Text>
      <View style={{ gap: 10, marginTop: 4 }}>
        {(q.options as string[]).map((opt, oi) => {
          const chosen = sel.has(opt);
          const isCorrect = correctSet.has(opt);
          const good = graded && isCorrect;
          const bad = graded && chosen && !isCorrect;
          const letter = String.fromCharCode(65 + oi);
          return (
            <Pressable key={opt} onPress={() => toggle(opt)}
              style={[styles.optRow,
                !graded && chosen && { borderColor: accent, backgroundColor: tint(accent, 0.08) },
                good && styles.optGood, bad && styles.optBad,
                graded && !good && !bad && { opacity: 0.6 }]}>
              <View style={[styles.optLetter,
                good ? { backgroundColor: slate.emerald } : bad ? { backgroundColor: slate.red } : chosen ? { backgroundColor: accent } : { backgroundColor: slate[200] }]}>
                <Text style={[styles.optLetterText, (good || bad || chosen) && { color: '#fff' }]}>{letter}</Text>
              </View>
              <Text style={styles.optText}>{opt}</Text>
              {good ? <Ionicons name="checkmark-circle" size={20} color={slate.emerald} /> : bad ? <Ionicons name="close-circle" size={20} color={slate.red} /> : null}
            </Pressable>
          );
        })}
      </View>
      {multi && !graded ? <Text style={styles.hintLeft}>Select all answers that apply.</Text> : null}
      {graded ? (
        <View style={styles.answerNote}>
          <Text style={styles.answerNoteLabel}>Correct answer{correctSet.size > 1 ? 's' : ''}: </Text>
          <Text style={styles.answerNoteVal}>{[...correctSet].join(' · ')}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ── Re-order paragraphs — up/down to reorder ──────────────────────────── */
function ReorderQ({ q, graded, accent, onReport }: { q: AnyQ; graded: boolean; accent: string; onReport: ReportFn }) {
  const correct: string[] = q.paragraphs;
  const [items, setItems] = useState<string[]>(() => {
    const s = shuffle(correct);
    return JSON.stringify(s) === JSON.stringify(correct) ? shuffle(s) : s;
  });

  useEffect(() => {
    onReport({ answered: true, allCorrect: JSON.stringify(items) === JSON.stringify(correct) });
  }, [items, correct, onReport]);

  const move = (i: number, dir: -1 | 1) => {
    if (graded) return;
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    setItems((a) => { const n = [...a]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  };

  return (
    <View>
      <Text style={styles.hintLeft}>Use the arrows to put the paragraphs in order.</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        {items.map((item, i) => {
          const good = graded && correct[i] === item;
          const bad = graded && correct[i] !== item;
          return (
            <View key={item} style={[styles.reorderRow, good && styles.optGood, bad && styles.optBad, !graded && { borderColor: slate[200] }]}>
              <View style={[styles.optLetter, good ? { backgroundColor: slate.emerald } : bad ? { backgroundColor: slate.red } : { backgroundColor: accent }]}>
                <Text style={[styles.optLetterText, { color: '#fff' }]}>{i + 1}</Text>
              </View>
              <Text style={styles.reorderText}>{item}</Text>
              {!graded ? (
                <View style={{ gap: 2 }}>
                  <Pressable onPress={() => move(i, -1)} disabled={i === 0} hitSlop={4} style={[styles.arrow, i === 0 && { opacity: 0.3 }]}><Ionicons name="chevron-up" size={18} color={slate[600]} /></Pressable>
                  <Pressable onPress={() => move(i, 1)} disabled={i === items.length - 1} hitSlop={4} style={[styles.arrow, i === items.length - 1 && { opacity: 0.3 }]}><Ionicons name="chevron-down" size={18} color={slate[600]} /></Pressable>
                </View>
              ) : good ? <Ionicons name="checkmark-circle" size={20} color={slate.emerald} /> : <Ionicons name="close-circle" size={20} color={slate.red} />}
            </View>
          );
        })}
      </View>
      {graded ? (
        <View style={styles.answerNote}>
          <Text style={styles.answerNoteLabel}>Correct order:</Text>
          {correct.map((para, i) => <Text key={i} style={styles.orderItem}>{i + 1}. {para}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 13, color: slate[500], marginTop: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  card: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 16 },
  passageBox: { backgroundColor: slate[50], borderRadius: 14, padding: 14 },
  passageText: { fontSize: 15.5, lineHeight: 30, color: slate[800] },
  blankInline: { borderWidth: 1, borderColor: slate[300], borderRadius: 6, color: slate[500], fontWeight: '700', overflow: 'hidden' },
  blankGood: { color: '#166534', borderColor: slate.emerald, backgroundColor: '#DCFCE7' },
  blankBad: { color: '#991B1B', borderColor: slate.red, backgroundColor: '#FEE2E2' },
  correctInline: { color: slate.emerald, fontWeight: '700', fontSize: 13 },

  question: { fontSize: 16, fontWeight: '800', color: slate[900], marginBottom: 10, marginTop: 8 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: slate[200], borderRadius: 14, padding: 13 },
  optGood: { borderColor: slate.emerald, backgroundColor: '#F0FDF4' },
  optBad: { borderColor: slate.red, backgroundColor: '#FEF2F2' },
  optLetter: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  optLetterText: { fontSize: 13, fontWeight: '900', color: slate[600] },
  optText: { flex: 1, fontSize: 15, color: slate[800], lineHeight: 21 },

  bankBox: { borderWidth: 1, borderColor: slate[200], borderRadius: 14, padding: 14, marginTop: 14 },
  bankLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: slate[500], marginBottom: 10 },
  bankRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bankChip: { borderWidth: 2, borderColor: slate[200], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: slate.white },
  bankChipText: { fontSize: 14, fontWeight: '700', color: slate[800] },

  reorderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 14, padding: 12, backgroundColor: slate.white },
  reorderText: { flex: 1, fontSize: 14, color: slate[800], lineHeight: 21 },
  arrow: { width: 30, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: slate[100] },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 14, padding: 12, marginTop: 16 },
  bannerGood: { borderColor: slate.emerald, backgroundColor: '#F0FDF4' },
  bannerBad: { borderColor: slate.red, backgroundColor: '#FEF2F2' },
  bannerText: { fontSize: 14, fontWeight: '800', flex: 1 },

  answerNote: { borderWidth: 1, borderColor: slate.emerald, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginTop: 14, gap: 4 },
  answerNoteLabel: { fontSize: 13, fontWeight: '800', color: '#166534' },
  answerNoteVal: { fontSize: 14, color: slate[700] },
  orderItem: { fontSize: 13.5, color: slate[700], lineHeight: 20 },

  controls: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 2, borderColor: slate[200], backgroundColor: slate.white },
  outlineBtnText: { color: slate[700], fontSize: 15, fontWeight: '800' },

  hint: { fontSize: 13, color: slate[500] },
  hintLeft: { fontSize: 12.5, color: slate[500], marginTop: 8 },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 18, padding: 10 },
  modalTitle: { fontSize: 13, fontWeight: '800', color: slate[500], padding: 10 },
  modalOpt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10 },
  modalOptText: { fontSize: 16, color: slate[800], fontWeight: '600' },
});
