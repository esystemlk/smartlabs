import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PromptPlayer } from '@/audio/player';
import { useAuth } from '@/auth/AuthContext';
import { recordAttempt } from '@/lib/attempts';
import { BackLink, slate, tint } from '@/ui/web';
import type { TrainerProps } from '@/trainers/types';

type Variant = 'mcq-single' | 'mcq-multiple' | 'summary' | 'missing-word' | 'fill-blanks' | 'highlight-words';
const VARIANT: Record<string, Variant> = {
  'listening-mcq-single': 'mcq-single',
  'listening-mcq-multiple': 'mcq-multiple',
  'highlight-correct-summary': 'summary',
  'select-missing-word': 'missing-word',
  'listening-fill-blanks': 'fill-blanks',
  'highlight-incorrect-words': 'highlight-words',
};
const SUBTITLE: Record<Variant, string> = {
  'mcq-single': 'Listen, then choose the single best answer.',
  'mcq-multiple': 'Listen, then select all answers that apply.',
  summary: 'Listen, then choose the summary that best matches the recording.',
  'missing-word': 'Listen — at the beep, choose the word that completes the recording.',
  'fill-blanks': 'Listen, then fill each blank with the correct word.',
  'highlight-words': 'Listen and tap the words that differ from what you hear.',
};

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export function ListeningTrainer({ task, question, accent, onBack }: TrainerProps) {
  const variant = VARIANT[task.taskType] ?? 'mcq-single';
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = question as any;

  const audioText: string = String(q.audioText ?? q.audioTextStart ?? '');
  const audioUrl: string | undefined = typeof q.audioUrl === 'string' ? q.audioUrl : undefined;
  const options: string[] = Array.isArray(q.options) ? q.options : [];
  const summaries: { id: string; text: string }[] = Array.isArray(q.summaries) ? q.summaries : [];
  const transcriptWords: string[] = Array.isArray(q.transcript) ? q.transcript : [];
  const fibParts = useMemo(() => (typeof q.transcript === 'string' ? String(q.transcript).split('{BLANK}') : []), [q.transcript]);
  const correctWords: string[] = Array.isArray(q.correctWords) ? q.correctWords : [];
  const blankCount = Math.max(0, fibParts.length - 1);

  const playerRef = useRef<PromptPlayer | null>(null);
  const [busyAudio, setBusyAudio] = useState(false);
  const [played, setPlayed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0); // 0..90

  // Answer state
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [fills, setFills] = useState<(string | null)[]>(() => Array(blankCount).fill(null));
  const [bank, setBank] = useState<string[]>(() => shuffle(correctWords));
  const [tapped, setTapped] = useState<number[]>([]);

  useEffect(() => () => { playerRef.current?.unload(); }, []);

  const playAudio = useCallback(async () => {
    setBusyAudio(true);
    try {
      if (!playerRef.current) {
        playerRef.current = new PromptPlayer();
        await playerRef.current.prepare({ audioUrl, text: audioText });
      }
      await playerRef.current.play();
      setPlayed(true);
    } catch {
      /* ignore playback errors */
    } finally {
      setBusyAudio(false);
    }
  }, [audioUrl, audioText]);

  const grade = useCallback((): number => {
    switch (variant) {
      case 'mcq-single':
        return single === q.correctAnswer ? 90 : 0;
      case 'missing-word':
        return single === q.correctAnswer ? 90 : 0;
      case 'summary':
        return single === q.correctSummaryId ? 90 : 0;
      case 'mcq-multiple': {
        const correct: string[] = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
        const good = multi.filter((m) => correct.includes(m)).length;
        const bad = multi.filter((m) => !correct.includes(m)).length;
        const frac = correct.length ? Math.max(0, good - bad) / correct.length : 0;
        return Math.round(frac * 90);
      }
      case 'fill-blanks': {
        const good = fills.filter((f, i) => f && f === correctWords[i]).length;
        return blankCount ? Math.round((good / blankCount) * 90) : 0;
      }
      case 'highlight-words': {
        const incorrect: string[] = Array.isArray(q.incorrectWords) ? q.incorrectWords : [];
        const norm = (w: string) => w.replace(/[^A-Za-z']/g, '').toLowerCase();
        const targets = new Set(incorrect.map(norm));
        const good = tapped.filter((i) => targets.has(norm(transcriptWords[i] ?? ''))).length;
        const bad = tapped.length - good;
        const frac = incorrect.length ? Math.max(0, good - bad) / incorrect.length : 0;
        return Math.round(frac * 90);
      }
    }
  }, [variant, single, multi, fills, tapped, q, correctWords, blankCount, transcriptWords]);

  const submit = () => {
    const s = grade();
    setScore(s);
    setSubmitted(true);
    recordAttempt(user?.uid, 'listening', task.taskType, s, 90);
  };

  const answered =
    variant === 'mcq-multiple' ? multi.length > 0
      : variant === 'fill-blanks' ? fills.some((f) => f)
        : variant === 'highlight-words' ? tapped.length > 0
          : single != null;

  // ── Word-bank fill helpers ──
  const placeWord = (w: string) => {
    const idx = fills.findIndex((f) => f == null);
    if (idx === -1) return;
    const nf = [...fills]; nf[idx] = w; setFills(nf);
    setBank(bank.filter((b, i) => !(b === w && i === bank.indexOf(w))));
  };
  const clearBlank = (i: number) => {
    const w = fills[i]; if (!w) return;
    const nf = [...fills]; nf[i] = null; setFills(nf);
    setBank([...bank, w]);
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <BackLink label="All items" onPress={onBack} accent={accent} />
          <Text style={[styles.title, { color: accent }]}>{task.label}</Text>
          <Text style={styles.subtitle}>{SUBTITLE[variant]}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: tint(accent, 0.12) }]}>
          <Ionicons name="headset" size={12} color={accent} />
          <Text style={[styles.pillText, { color: accent }]}>Auto · {task.weight}</Text>
        </View>
      </View>

      {/* Audio */}
      <View style={styles.audioCard}>
        <Pressable onPress={playAudio} disabled={busyAudio} style={[styles.playBtn, { backgroundColor: accent }]}>
          {busyAudio ? <ActivityIndicator color="#fff" /> : <Ionicons name={played ? 'reload' : 'play'} size={22} color="#fff" />}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.audioTitle}>{played ? 'Play again' : 'Play the recording'}</Text>
          <Text style={styles.audioHint}>The audio is generated from the transcript. Listen carefully, then answer.</Text>
        </View>
      </View>

      {/* Question */}
      <View style={styles.card}>
        {(variant === 'mcq-single' || variant === 'mcq-multiple') && q.question ? (
          <Text style={styles.question}>{q.question}</Text>
        ) : null}

        {/* Single-answer options (mcq-single, missing-word) */}
        {(variant === 'mcq-single' || variant === 'missing-word') &&
          options.map((opt) => {
            const chosen = single === opt;
            const correct = submitted && opt === q.correctAnswer;
            const wrong = submitted && chosen && opt !== q.correctAnswer;
            return (
              <OptionRow key={opt} label={opt} chosen={chosen} correct={correct} wrong={wrong} accent={accent}
                disabled={submitted} onPress={() => setSingle(opt)} multi={false} />
            );
          })}

        {/* Multiple-answer options */}
        {variant === 'mcq-multiple' &&
          options.map((opt) => {
            const chosen = multi.includes(opt);
            const isCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(opt);
            const correct = submitted && isCorrect;
            const wrong = submitted && chosen && !isCorrect;
            return (
              <OptionRow key={opt} label={opt} chosen={chosen} correct={correct} wrong={wrong} accent={accent}
                disabled={submitted} multi
                onPress={() => setMulti(chosen ? multi.filter((m) => m !== opt) : [...multi, opt])} />
            );
          })}

        {/* Highlight correct summary */}
        {variant === 'summary' &&
          summaries.map((s) => {
            const chosen = single === s.id;
            const correct = submitted && s.id === q.correctSummaryId;
            const wrong = submitted && chosen && s.id !== q.correctSummaryId;
            return (
              <OptionRow key={s.id} label={s.text} chosen={chosen} correct={correct} wrong={wrong} accent={accent}
                disabled={submitted} multi={false} onPress={() => setSingle(s.id)} />
            );
          })}

        {/* Fill in the blanks */}
        {variant === 'fill-blanks' && (
          <View>
            <Text style={styles.fibText}>
              {fibParts.map((part, i) => (
                <Text key={i}>
                  {part}
                  {i < blankCount ? (
                    <Text
                      onPress={() => !submitted && clearBlank(i)}
                      style={[
                        styles.blank,
                        fills[i] ? { color: accent } : null,
                        submitted && (fills[i] === correctWords[i] ? styles.blankGood : styles.blankBad),
                      ]}
                    >
                      {' '}{fills[i] ?? '_____'}{submitted && fills[i] !== correctWords[i] ? ` (${correctWords[i]})` : ''}{' '}
                    </Text>
                  ) : null}
                </Text>
              ))}
            </Text>
            {!submitted && (
              <View style={styles.bank}>
                {bank.map((w, i) => (
                  <Pressable key={`${w}-${i}`} onPress={() => placeWord(w)} style={[styles.chip, { borderColor: accent }]}>
                    <Text style={[styles.chipText, { color: accent }]}>{w}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Highlight incorrect words */}
        {variant === 'highlight-words' && (
          <Text style={styles.hiwText}>
            {transcriptWords.map((w, i) => {
              const isTapped = tapped.includes(i);
              const norm = (x: string) => x.replace(/[^A-Za-z']/g, '').toLowerCase();
              const isTarget = Array.isArray(q.incorrectWords) && q.incorrectWords.map(norm).includes(norm(w));
              let bg: string | undefined;
              if (submitted) {
                if (isTarget) bg = '#DCFCE7'; else if (isTapped) bg = '#FEE2E2';
              } else if (isTapped) bg = tint(accent, 0.16);
              return (
                <Text key={i} onPress={() => !submitted && setTapped(isTapped ? tapped.filter((t) => t !== i) : [...tapped, i])}
                  style={[styles.hiwWord, bg ? { backgroundColor: bg } : null]}>
                  {w}{' '}
                </Text>
              );
            })}
          </Text>
        )}
      </View>

      {/* Submit / Result */}
      {!submitted ? (
        <Pressable onPress={submit} disabled={!answered} style={[styles.submit, { backgroundColor: answered ? accent : slate[300] }]}>
          <Text style={styles.submitText}>Submit answer</Text>
        </Pressable>
      ) : (
        <View style={styles.result}>
          <View style={styles.resultRow}>
            <Ionicons name={score >= 60 ? 'checkmark-circle' : score > 0 ? 'alert-circle' : 'close-circle'} size={22}
              color={score >= 60 ? slate.emerald : score > 0 ? slate[500] : slate.red} />
            <Text style={styles.resultText}>Score {score} / 90</Text>
          </View>
          <Pressable onPress={onBack} style={styles.another}><Text style={styles.anotherText}>Practise another</Text></Pressable>
        </View>
      )}
    </View>
  );
}

function OptionRow({ label, chosen, correct, wrong, accent, disabled, multi, onPress }: {
  label: string; chosen: boolean; correct: boolean; wrong: boolean; accent: string; disabled: boolean; multi: boolean; onPress: () => void;
}) {
  const border = correct ? slate.emerald : wrong ? slate.red : chosen ? accent : slate[200];
  const bg = correct ? '#F0FDF4' : wrong ? '#FEF2F2' : chosen ? tint(accent, 0.06) : '#fff';
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.opt, { borderColor: border, backgroundColor: bg }]}>
      <View style={[styles.tick, multi ? styles.sq : null, { borderColor: chosen || correct || wrong ? border : slate[300], backgroundColor: chosen || correct ? border : 'transparent' }]}>
        {(chosen || correct) ? <Ionicons name={multi ? 'checkmark' : 'ellipse'} size={multi ? 13 : 9} color="#fff" /> : null}
      </View>
      <Text style={styles.optText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  subtitle: { fontSize: 13, color: slate[500], marginTop: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 22 },
  pillText: { fontSize: 11, fontWeight: '800' },

  audioCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 16 },
  playBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontSize: 15, fontWeight: '800', color: slate[900] },
  audioHint: { fontSize: 12, color: slate[500], marginTop: 2, lineHeight: 17 },

  card: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 16, gap: 10 },
  question: { fontSize: 16, fontWeight: '700', color: slate[800], lineHeight: 23, marginBottom: 2 },

  opt: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14 },
  tick: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  sq: { borderRadius: 6 },
  optText: { flex: 1, fontSize: 14.5, color: slate[700], lineHeight: 21 },

  fibText: { fontSize: 16, lineHeight: 30, color: slate[800] },
  blank: { fontWeight: '800', color: slate[400] },
  blankGood: { color: slate.emerald },
  blankBad: { color: slate.red },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '800' },

  hiwText: { fontSize: 16, lineHeight: 32, color: slate[800] },
  hiwWord: { fontSize: 16, borderRadius: 4 },

  submit: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  result: { backgroundColor: slate.white, borderRadius: 18, borderWidth: 1, borderColor: slate[200], padding: 16, gap: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultText: { fontSize: 17, fontWeight: '800', color: slate[900] },
  another: { backgroundColor: slate[900], borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  anotherText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
