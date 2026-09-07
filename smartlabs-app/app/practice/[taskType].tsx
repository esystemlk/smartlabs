import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { fetchCatalog, fetchQuestions, type PteTask } from '@/api/questions';
import { scoreSwt } from '@/api/score';
import { ApiError } from '@/api/client';
import { Button, Card, Pill } from '@/ui/components';
import { theme, hueFor } from '@/theme';

type AnyQ = Record<string, unknown> & { id?: string };

/** Best-effort extraction of a question's main prompt text across bank shapes. */
function promptOf(q: AnyQ): string {
  for (const k of ['passage', 'text', 'prompt', 'question', 'sentence', 'topic', 'caption', 'transcript']) {
    const v = q[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return JSON.stringify(q, null, 2);
}

export default function TaskScreen() {
  const { taskType } = useLocalSearchParams<{ taskType: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const [task, setTask] = useState<PteTask | null>(null);
  const [questions, setQuestions] = useState<AnyQ[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cat, qs] = await Promise.all([fetchCatalog(), fetchQuestions<AnyQ>(taskType!)]);
        if (!alive) return;
        const found = cat.catalog.flatMap((s) => s.tasks).find((t) => t.taskType === taskType) ?? null;
        setTask(found);
        setQuestions(qs.questions);
        if (found) navigation.setOptions({ title: found.label });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load this task.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [taskType]);

  const current = useMemo(() => (questions && questions.length ? questions[idx % questions.length] : null), [questions, idx]);

  if (error) return <Centered><Text style={styles.error}>{error}</Text></Centered>;
  if (!questions || !current) return <Centered><ActivityIndicator color={theme.colors.accent} size="large" /></Centered>;

  const hue = hueFor(task?.color);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pill text={task?.scoring === 'ai' ? 'AI scored' : 'Auto scored'} color={hue} />
        <Text style={styles.counter}>
          {(idx % questions.length) + 1} / {questions.length}
        </Text>
      </View>

      {taskType === 'swt' ? (
        <SwtTrainer key={current.id ?? idx} passage={promptOf(current)} onNext={() => setIdx((i) => i + 1)} />
      ) : (
        <GenericViewer
          prompt={promptOf(current)}
          isAi={task?.scoring === 'ai'}
          onNext={() => setIdx((i) => i + 1)}
        />
      )}
    </ScrollView>
  );

  function GenericViewer({ prompt, isAi, onNext }: { prompt: string; isAi: boolean; onNext: () => void }) {
    return (
      <View style={{ gap: 16 }}>
        <Card>
          <Text style={styles.prompt}>{prompt}</Text>
        </Card>
        <Card style={{ gap: 8 }}>
          <Text style={styles.soonTitle}>Trainer coming soon</Text>
          <Text style={styles.soonBody}>
            The interactive {isAi ? 'AI-scored' : ''} trainer for this task type is on the roadmap. The question bank
            and scoring API are already wired — this screen will host the full flow next.
          </Text>
        </Card>
        <Button label="Next question" variant="ghost" onPress={onNext} />
      </View>
    );
  }
}

function SwtTrainer({ passage, onNext }: { passage: string; onNext: () => void }) {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const submit = async () => {
    setError(null);
    if (words < 5) return setError('Write a one-sentence summary first.');
    setLoading(true);
    try {
      const r = await scoreSwt({ passage, summary: summary.trim() });
      setResult(r);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NO_CREDITS') {
        setError('You are out of SWT credits.');
        router.push('/credits');
      } else {
        setError(e instanceof Error ? e.message : 'Scoring failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View style={{ gap: 16 }}>
        <Card style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.scoreBig}>
            {result.total} <Text style={styles.scoreMax}>/ {result.maxTotal}</Text>
          </Text>
          <Text style={styles.scoreLabel}>Summarize Written Text</Text>
        </Card>
        {result.scores ? (
          <Card style={{ gap: 8 }}>
            {Object.entries(result.scores).map(([k, v]) => (
              <View key={k} style={styles.scoreRow}>
                <Text style={styles.scoreRowLabel}>{k}</Text>
                <Text style={styles.scoreRowVal}>{String(v)}</Text>
              </View>
            ))}
          </Card>
        ) : null}
        {typeof result.summaryText === 'string' ? (
          <Card><Text style={styles.prompt}>{result.summaryText}</Text></Card>
        ) : null}
        <Button label="Try another" onPress={() => { setResult(null); setSummary(''); onNext(); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Text style={styles.prompt}>{passage}</Text>
      </Card>
      <Card style={{ gap: 8 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.fieldLabel}>Your summary (one sentence)</Text>
          <Text style={styles.words}>{words} words</Text>
        </View>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Write a single-sentence summary…"
          placeholderTextColor={theme.colors.textFaint}
          multiline
          style={styles.textarea}
        />
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Score my summary" onPress={submit} loading={loading} />
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  center: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { color: theme.colors.textFaint, fontSize: theme.font.small, fontWeight: '600' },
  prompt: { color: theme.colors.text, fontSize: theme.font.body, lineHeight: 23 },
  soonTitle: { color: theme.colors.accent, fontSize: theme.font.h3, fontWeight: '700' },
  soonBody: { color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 20 },
  fieldLabel: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '600' },
  words: { color: theme.colors.textFaint, fontSize: theme.font.small },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textarea: {
    minHeight: 110,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  error: { color: theme.colors.danger, fontSize: theme.font.small },
  scoreBig: { color: theme.colors.accent, fontSize: 44, fontWeight: '800' },
  scoreMax: { color: theme.colors.textFaint, fontSize: 22, fontWeight: '600' },
  scoreLabel: { color: theme.colors.textMuted, fontSize: theme.font.small },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreRowLabel: { color: theme.colors.textMuted, fontSize: theme.font.body, textTransform: 'capitalize' },
  scoreRowVal: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' },
});
