import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchCatalog, type PteSection, type PteTask } from '@/api/questions';
import { Pill } from '@/ui/components';
import { theme, hueFor } from '@/theme';

export default function Practice() {
  const router = useRouter();
  const [sections, setSections] = useState<PteSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then((r) => setSections(r.catalog))
      .catch((e) => setError(e?.message ?? 'Could not load the catalogue.'));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!sections) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <View key={section.id} style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>{section.label}</Text>
          <View style={{ gap: 10 }}>
            {section.tasks.map((task) => (
              <TaskRow key={task.taskType} task={task} onPress={() => router.push(`/practice/${task.taskType}`)} />
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function TaskRow({ task, onPress }: { task: PteTask; onPress: () => void }) {
  const hue = hueFor(task.color);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1, borderLeftColor: hue }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.rowTop}>
          <Text style={styles.taskLabel}>{task.label}</Text>
          {task.isNew ? <Pill text="New" color={theme.colors.amber} /> : null}
        </View>
        <View style={styles.rowTags}>
          <Pill text={task.scoring === 'ai' ? 'AI scored' : 'Auto'} color={task.scoring === 'ai' ? hue : theme.colors.textFaint} />
          <Text style={styles.weight}>{task.weight}</Text>
        </View>
      </View>
      <Text style={[styles.chev, { color: hue }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  center: { flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: theme.colors.danger, textAlign: 'center' },
  sectionTitle: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    padding: 16,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTags: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskLabel: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  weight: { color: theme.colors.textFaint, fontSize: theme.font.small },
  chev: { fontSize: 28, fontWeight: '400', marginLeft: 8 },
});
