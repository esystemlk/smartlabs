import { useAppLayout } from '@/ui/layout';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { fetchCatalog, fetchQuestions, type PteTask } from '@/api/questions';
import { hueFor } from '@/theme';
import { trainerFor } from '@/trainers';
import type { AnyQuestion } from '@/trainers/types';
import { TrainerHeader, SelectionCard, slate, tint } from '@/ui/web';

/** Best-effort preview text of a question across bank shapes. */
function previewOf(q: AnyQuestion): string {
  for (const k of ['passage', 'topic', 'text', 'situation', 'describe']) {
    const v = q[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}
const str = (q: AnyQuestion, k: string): string | undefined => (typeof q[k] === 'string' ? (q[k] as string) : undefined);

const AUDIO_TASKS = new Set([
  'sst', 'wfd', 'repeat-sentence', 'retell-lecture', 'answer-short-question', 'summarize-group-discussion',
  'listening-mcq-single', 'listening-mcq-multiple', 'highlight-correct-summary', 'select-missing-word',
  'listening-fill-blanks', 'highlight-incorrect-words',
]);

const OVERLINE: Record<string, string> = {
  swt: 'Summarize Written Text',
  'write-essay': 'Write Essay',
  sst: 'Summarize Spoken Text',
  wfd: 'Write from Dictation',
};

export default function TaskScreen() {
  const layout = useAppLayout();
  const { taskType } = useLocalSearchParams<{ taskType: string }>();
  const navigation = useNavigation();

  const [task, setTask] = useState<PteTask | null>(null);
  const [questions, setQuestions] = useState<AnyQuestion[] | null>(null);
  const [selected, setSelected] = useState<AnyQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters (used when the bank has prediction groups / categories, e.g. essay).
  const [group, setGroup] = useState<'prediction' | 'all'>('all');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, qs] = await Promise.all([fetchCatalog(), fetchQuestions<AnyQuestion>(taskType!)]);
        if (!alive) return;
        const found = c.catalog.flatMap((s) => s.tasks).find((t) => t.taskType === taskType) ?? null;
        setTask(found);
        setQuestions(qs.questions);
        if (qs.questions.some((q) => q.group === 'prediction')) setGroup('prediction');
        if (found) navigation.setOptions({ title: found.label });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load this task.');
      }
    })();
    return () => { alive = false; };
  }, [taskType]);

  const hasGroups = useMemo(() => (questions ?? []).some((q) => q.group === 'prediction'), [questions]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions ?? []) { const c = str(q, 'category'); if (c) set.add(c); }
    return ['All', ...[...set].sort()];
  }, [questions]);

  const filtered = useMemo(() => {
    let list = questions ?? [];
    if (hasGroups && group === 'prediction') list = list.filter((q) => q.group === 'prediction');
    if (cat !== 'All') list = list.filter((q) => str(q, 'category') === cat);
    if (hasGroups && group === 'prediction') {
      list = [...list].sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
    }
    return list;
  }, [questions, hasGroups, group, cat]);

  if (error) return <Centered><Text style={styles.error}>{error}</Text></Centered>;
  if (!task || !questions) return <Centered><ActivityIndicator color={slate[400]} size="large" /></Centered>;

  const accent = hueFor(task.color);
  const Trainer = trainerFor(task.taskType);
  const audio = AUDIO_TASKS.has(task.taskType);

  // ── Practice + result view for the chosen question ──
  if (selected && Trainer) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, layout.content]}>
        <Trainer key={String(selected.id)} task={task} question={selected} accent={accent} onBack={() => setSelected(null)} />
      </ScrollView>
    );
  }

  // ── Question selection ──
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, layout.content]}>
      <TrainerHeader
        overline={OVERLINE[task.taskType] ?? task.label}
        title="AI Trainer"
        accentWord="& Examiner"
        subtitle={Trainer ? 'Pick an item below, respond, and get a full score breakdown with coaching.' : 'This task type is coming soon.'}
        accent={accent}
      />

      {!Trainer ? (
        <View style={styles.soon}>
          <Text style={styles.soonTitle}>Trainer coming soon</Text>
          <Text style={styles.soonBody}>The question bank is ready — the interactive trainer for this task is on the way.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {/* Prediction / All toggle */}
          {hasGroups ? (
            <View style={styles.segment}>
              {(['prediction', 'all'] as const).map((g) => (
                <Pressable key={g} onPress={() => setGroup(g)} style={[styles.seg, group === g && { backgroundColor: accent }]}>
                  <Text style={[styles.segText, group === g && { color: '#fff' }]}>{g === 'prediction' ? '⭐ Predictions' : 'All topics'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Category chips */}
          {categories.length > 2 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((c) => (
                <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, cat === c ? { backgroundColor: tint(accent, 0.14), borderColor: accent } : null]}>
                  <Text style={[styles.chipText, cat === c && { color: accent }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <Text style={styles.chooseLabel}>
            {hasGroups && group === 'prediction' ? 'PREDICTED QUESTIONS' : 'CHOOSE AN ITEM'} · {filtered.length}
          </Text>

          {filtered.length === 0 ? (
            <Text style={styles.soonBody}>No items match this filter.</Text>
          ) : (
            filtered.map((q, i) => (
              <SelectionCard
                key={String(q.id ?? i)}
                index={q.group === 'prediction' && q.no != null ? Number(q.no) : i + 1}
                title={str(q, 'title') || `${task.label} ${i + 1}`}
                category={str(q, 'category')}
                preview={audio ? undefined : previewOf(q)}
                audio={audio}
                accent={accent}
                onPress={() => setSelected(q)}
              />
            ))
          )}
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

  segment: { flexDirection: 'row', backgroundColor: slate[100], borderRadius: 14, padding: 4, gap: 4 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  segText: { fontSize: 13.5, fontWeight: '800', color: slate[600] },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 1, borderColor: slate[200], backgroundColor: '#fff', justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '700', color: slate[600] },
});
