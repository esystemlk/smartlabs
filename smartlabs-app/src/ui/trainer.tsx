import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PromptPlayer } from '@/audio/player';
import { Card } from '@/ui/components';
import { theme } from '@/theme';
import type { WfdToken } from '@/scoring/wfd';

/** A play button that lazily prepares the prompt audio (hosted URL or TTS). */
export function AudioButton({
  audioUrl,
  text,
  label = 'Play audio',
}: {
  audioUrl?: string;
  text?: string;
  label?: string;
}) {
  const playerRef = useRef<PromptPlayer | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    playerRef.current = new PromptPlayer();
    return () => {
      playerRef.current?.unload();
    };
  }, []);

  const onPress = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (state === 'ready') {
      await player.play();
      return;
    }
    setState('loading');
    try {
      await player.prepare({ audioUrl, text });
      setState('ready');
      await player.play();
    } catch {
      setState('error');
    }
  };

  const icon = state === 'ready' ? 'play' : state === 'error' ? 'refresh' : 'volume-high';
  return (
    <Pressable onPress={onPress} disabled={state === 'loading'} style={({ pressed }) => [styles.audioBtn, { opacity: pressed ? 0.85 : 1 }]}>
      {state === 'loading' ? (
        <ActivityIndicator color={theme.colors.onAccent} />
      ) : (
        <Ionicons name={icon} size={20} color={theme.colors.onAccent} />
      )}
      <Text style={styles.audioLabel}>
        {state === 'ready' ? 'Play again' : state === 'error' ? 'Retry audio' : label}
      </Text>
    </Pressable>
  );
}

export function ScoreHeader({ score, max, label }: { score: number | string; max: number | string; label: string }) {
  return (
    <Card style={{ alignItems: 'center', gap: 4 }}>
      <Text style={styles.scoreBig}>
        {score} <Text style={styles.scoreMax}>/ {max}</Text>
      </Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </Card>
  );
}

export function ScoreBreakdown({ scores }: { scores: Record<string, unknown> }) {
  return (
    <Card style={{ gap: 8 }}>
      {Object.entries(scores).map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.rowLabel}>{k}</Text>
          <Text style={styles.rowVal}>{String(v)}</Text>
        </View>
      ))}
    </Card>
  );
}

export function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card style={{ gap: 6 }}>
      <Text style={styles.blockTitle}>{title}</Text>
      {items.map((t, i) => (
        <Text key={i} style={styles.bullet}>• {t}</Text>
      ))}
    </Card>
  );
}

const WFD_COLORS: Record<WfdToken['kind'], string> = {
  correct: theme.colors.success,
  missing: theme.colors.danger,
  incorrect: theme.colors.danger,
  misspelled: theme.colors.amber,
  extra: theme.colors.textFaint,
  order: theme.colors.coral,
};

/** Word-by-word coloured breakdown for WFD. */
export function WordChips({ analysis }: { analysis: WfdToken[] }) {
  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.chipWrap}>
        {analysis.map((t, i) => {
          const word = t.actual ?? t.expected ?? '';
          const strike = t.kind === 'extra';
          return (
            <Text
              key={i}
              style={[
                styles.chip,
                { color: WFD_COLORS[t.kind], borderColor: WFD_COLORS[t.kind] + '55' },
                strike && { textDecorationLine: 'line-through' },
              ]}
            >
              {t.kind === 'missing' ? `[${word}]` : word}
            </Text>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend color={theme.colors.success} label="correct" />
        <Legend color={theme.colors.danger} label="missing/wrong" />
        <Legend color={theme.colors.amber} label="misspelled" />
        <Legend color={theme.colors.coral} label="order" />
      </View>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export function Answerbox({
  value,
  onChangeText,
  placeholder,
  wordTarget,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  wordTarget?: string;
}) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <Card style={{ gap: 8 }}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Your answer</Text>
        <Text style={styles.words}>
          {words} words{wordTarget ? ` · ${wordTarget}` : ''}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        multiline
        style={styles.textarea}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },
  audioLabel: { color: theme.colors.onAccent, fontSize: 16, fontWeight: '700' },
  scoreBig: { color: theme.colors.accent, fontSize: 44, fontWeight: '800' },
  scoreMax: { color: theme.colors.textFaint, fontSize: 22, fontWeight: '600' },
  scoreLabel: { color: theme.colors.textMuted, fontSize: theme.font.small },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: theme.colors.textMuted, fontSize: theme.font.body, textTransform: 'capitalize' },
  rowVal: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' },
  words: { color: theme.colors.textFaint, fontSize: theme.font.small },
  blockTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  bullet: { color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    fontSize: theme.font.small,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: theme.colors.textFaint, fontSize: theme.font.tiny },
  textarea: {
    minHeight: 120,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
