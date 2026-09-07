import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { fetchCatalog, fetchQuestions, type PteTask } from '@/api/questions';
import { hueFor } from '@/theme';
import { trainerFor } from '@/trainers';
import type { AnyQuestion } from '@/trainers/types';
import { TrainerHeader, SelectionCard, BackLink, slate } from '@/ui/web';

/** Best-effort preview text of a question across bank shapes. */
function previewOf(q: AnyQuestion): string {
  for (const k of ['passage', 'topic', 'text', 'situation', 'describe']) {
    const v = q[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

// Tasks where the prompt is audio (hidden text) — selection shows an audio hint.
const AUDIO_TASKS = new Set([
  'sst', 'wfd', 'repeat-sentence', 'retell-lecture', 'answer-short-question', 'summarize-group-discussion',
]);

const OVERLINE: Record<string, string> = {
  swt: 'Summarize Written Text',
  'write-essay': 'Write Essay',
  sst: 'Summarize Spoken Text',
  wfd: 'Write from Dictation',
};

export default function TaskScreen() {
  const { taskType } = useLocalSearchParams<{ taskType: string }>();
  const navigation = useNavigation();

  const [task, setTask] = useState<PteTask | null>(null);
  const [questions, setQuestions] = useState<AnyQuestion[] | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
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

  const selected = useMemo(
    () => (questions && selectedIdx != null ? questions[selectedIdx] : null),
    [questions, selectedIdx],
  );

  if (error) return <Centered><Text style={styles.error}>{error}</Text></Centered>;
  if (!task || !questions) return <Centered><ActivityIndicator color={slate[400]} size="large" /></Centered>;

  const accent = hueFor(task.color);
  const Trainer = trainerFor(task.taskType);
  const audio = AUDIO_TASKS.has(task.taskType);

  // ── Practice + result view for the chosen question ──
  if (selected && Trainer) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Trainer
          key={selected.id ?? selectedIdx}
          task={task}
          question={selected}
          accent={accent}
          onBack={() => setSelectedIdx(null)}
        />
      </ScrollView>
    );
  }

  // ── Question selection grid ──
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TrainerHeader
        overline={OVERLINE[task.taskType] ?? task.label}
        title="AI Trainer"
        accentWord="& Examiner"
        subtitle={
          Trainer
            ? 'Pick an item below, respond, and get a full AI score breakdown with coaching.'
            : 'This task type is coming soon.'
        }
        accent={accent}
      />

      {!Trainer ? (
        <View style={styles.soon}>
          <Text style={styles.soonTitle}>Trainer coming soon</Text>
          <Text style={styles.soonBody}>The question bank is ready — the interactive trainer for this task is on the way.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={styles.chooseLabel}>CHOOSE AN ITEM · {questions.length}</Text>
          {questions.map((q, i) => (
            <SelectionCard
              key={q.id ?? i}
              index={i + 1}
              title={(typeof q.title === 'string' && q.title) || `${task.label} ${i + 1}`}
              category={typeof q.category === 'string' ? q.category : undefined}
              preview={audio ? undefined : previewOf(q)}
              audio={audio}
              accent={accent}
              onPress={() => setSelectedIdx(i)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: slate.white },
  content: { padding: 18, gap: 18, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: slate.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: slate.red, textAlign: 'center' },
  chooseLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: slate[500] },
  soon: { alignItems: 'center', gap: 6, padding: 28, borderRadius: 24, borderWidth: 1, borderColor: slate[200], borderStyle: 'dashed', backgroundColor: slate[50] },
  soonTitle: { fontSize: 16, fontWeight: '800', color: slate[700] },
  soonBody: { fontSize: 13, color: slate[400], textAlign: 'center', lineHeight: 19 },
});
