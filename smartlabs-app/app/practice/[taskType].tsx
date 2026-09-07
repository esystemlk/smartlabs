import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { fetchCatalog, fetchQuestions, type PteTask } from '@/api/questions';
import { Button, Card, Pill } from '@/ui/components';
import { theme, hueFor } from '@/theme';
import { trainerFor } from '@/trainers';
import type { AnyQuestion } from '@/trainers/types';

/** Best-effort extraction of a question's main prompt text across bank shapes. */
function promptOf(q: AnyQuestion): string {
  for (const k of ['passage', 'text', 'prompt', 'question', 'sentence', 'topic', 'caption', 'transcript']) {
    const v = q[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return JSON.stringify(q, null, 2);
}

export default function TaskScreen() {
  const { taskType } = useLocalSearchParams<{ taskType: string }>();
  const navigation = useNavigation();

  const [task, setTask] = useState<PteTask | null>(null);
  const [questions, setQuestions] = useState<AnyQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cat, qs] = await Promise.all([fetchCatalog(), fetchQuestions<AnyQuestion>(taskType!)]);
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

  const current = useMemo(
    () => (questions && questions.length ? questions[idx % questions.length] : null),
    [questions, idx],
  );

  if (error) return <Centered><Text style={styles.error}>{error}</Text></Centered>;
  if (!task || !questions || !current) return <Centered><ActivityIndicator color={theme.colors.accent} size="large" /></Centered>;

  const hue = hueFor(task.color);
  const Trainer = trainerFor(task.taskType);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pill text={task.scoring === 'ai' ? 'AI scored' : 'Auto scored'} color={hue} />
        <Text style={styles.counter}>{(idx % questions.length) + 1} / {questions.length}</Text>
      </View>

      {Trainer ? (
        <Trainer key={current.id ?? idx} task={task} question={current} onNext={() => setIdx((i) => i + 1)} />
      ) : (
        <View style={{ gap: 16 }}>
          <Card><Text style={styles.prompt}>{promptOf(current)}</Text></Card>
          <Card style={{ gap: 8 }}>
            <Text style={styles.soonTitle}>Trainer coming soon</Text>
            <Text style={styles.soonBody}>
              The interactive trainer for this task type is on the roadmap. The question bank and scoring are already
              wired — this screen will host the full flow next.
            </Text>
          </Card>
          <Button label="Next question" variant="ghost" onPress={() => setIdx((i) => i + 1)} />
        </View>
      )}
    </ScrollView>
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
  error: { color: theme.colors.danger, textAlign: 'center' },
});
