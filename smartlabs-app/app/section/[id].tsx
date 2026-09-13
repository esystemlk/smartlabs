import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchCatalog, type PteSection, type PteTask } from '@/api/questions';
import { isImplemented } from '@/trainers';
import { ScreenHeader } from '@/ui/brand';
import { C } from '@/theme';

const SKILL_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }> = {
  speaking: { label: 'Speaking', icon: 'mic', fg: C.speaking, bg: C.speakingBg },
  reading: { label: 'Reading', icon: 'book', fg: C.reading, bg: C.readingBg },
  writing: { label: 'Writing', icon: 'pencil', fg: C.writing, bg: C.writingBg },
  listening: { label: 'Listening', icon: 'headset', fg: C.listening, bg: C.listeningBg },
};

/** Task list for one skill — bridges the Practice Arena to the trainer. */
export default function SectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [section, setSection] = useState<PteSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = SKILL_META[id ?? ''] ?? SKILL_META.speaking;

  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then((r) => {
        if (!alive) return;
        setSection(r.catalog.find((sec) => sec.id === id) ?? null);
      })
      .catch((e) => alive && setError(e?.message ?? 'Could not load tasks.'));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <ScreenHeader title={meta.label} />
      </View>
      {error ? (
        <View style={s.center}><Text style={s.error}>{error}</Text></View>
      ) : !section ? (
        <View style={s.center}><ActivityIndicator color={C.blue} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.hero, { backgroundColor: meta.bg }]}>
            <View style={[s.heroIcon, { backgroundColor: '#fff' }]}>
              <Ionicons name={meta.icon} size={24} color={meta.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>{meta.label}</Text>
              <Text style={s.heroSub}>{section.tasks.length} task types · pick one to start</Text>
            </View>
          </View>

          <View style={{ gap: 12, marginTop: 18 }}>
            {section.tasks.map((task) => (
              <TaskRow key={task.taskType} task={task} fg={meta.fg} enabled={isImplemented(task.taskType)} onPress={() => router.push(`/practice/${task.taskType}`)} />
            ))}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TaskRow({ task, fg, enabled, onPress }: { task: PteTask; fg: string; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [s.row, !enabled && s.rowOff, enabled && pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1 }}>
        <View style={s.rowTop}>
          <Text style={s.rowLabel}>{task.label}</Text>
          {task.isNew ? <Badge text="New" color={C.amber} /> : null}
          {!enabled ? <Badge text="Soon" color={C.faint} /> : null}
        </View>
        <View style={s.rowTags}>
          <Badge text={task.scoring === 'ai' ? 'AI scored' : 'Auto'} color={enabled ? (task.scoring === 'ai' ? fg : C.slateLight) : C.faint} soft />
          <Text style={s.weight}>{task.weight}</Text>
        </View>
      </View>
      {enabled ? <Ionicons name="chevron-forward" size={20} color={C.faint} /> : <Ionicons name="lock-closed" size={16} color={C.faint} />}
    </Pressable>
  );
}

function Badge({ text, color, soft }: { text: string; color: string; soft?: boolean }) {
  return (
    <View style={{ backgroundColor: color + (soft ? '18' : '22'), paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerWrap: { paddingHorizontal: 20, paddingTop: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: C.danger, textAlign: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16 },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: C.navy },
  heroSub: { fontSize: 13, color: C.slate, marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16,
  },
  rowOff: { opacity: 0.6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTags: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  rowLabel: { fontSize: 16, fontWeight: '700', color: C.navy },
  weight: { fontSize: 12, color: C.faint, fontWeight: '600' },
});
