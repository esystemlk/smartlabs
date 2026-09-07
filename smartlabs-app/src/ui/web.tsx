import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { PromptPlayer } from '@/audio/player';

/**
 * Website-matching UI kit for the app trainers — mirrors the look of the
 * smartlabs.lk AI pages: white cards with rounded corners and thin slate
 * borders, a per-task accent colour, uppercase tracking labels, big black
 * headings, a circular score badge, score pills and colour-barred sections.
 */

// slate palette from the website (bg-white text-slate-900 …)
export const slate = {
  900: '#0F172A',
  800: '#1E293B',
  700: '#334155',
  600: '#475569',
  500: '#64748B',
  400: '#94A3B8',
  300: '#CBD5E1',
  200: '#E2E8F0',
  100: '#F1F5F9',
  50: '#F8FAFC',
  white: '#FFFFFF',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  red: '#DC2626',
  redBg: '#FEF2F2',
};

/** Translucent tint of an accent hex (for bg-50 / border-200 style fills). */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TrainerHeader({
  overline,
  title,
  accentWord,
  subtitle,
  accent,
}: {
  overline: string;
  title: string;
  accentWord?: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Text style={[styles.overline, { color: accent }]}>{overline.toUpperCase()}</Text>
      <Text style={styles.h1}>
        {title} {accentWord ? <Text style={{ color: accent }}>{accentWord}</Text> : null}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function BackLink({ label, onPress, accent }: { label: string; onPress: () => void; accent: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.backLink, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name="chevron-back" size={16} color={slate[500]} />
      <Text style={[styles.backText, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

export function SelectionCard({
  index,
  title,
  category,
  preview,
  audio,
  accent,
  onPress,
}: {
  index: number;
  title: string;
  category?: string;
  preview?: string;
  audio?: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selCard, { borderColor: pressed ? accent : slate[200] }]}
    >
      <View style={styles.selTop}>
        <Text style={[styles.selIndex, { color: accent }]}>ITEM {index}</Text>
        {category ? (
          <View style={[styles.chip, { backgroundColor: tint(accent, 0.08), borderColor: tint(accent, 0.25) }]}>
            <Text style={[styles.chipText, { color: accent }]}>{category}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.selTitle}>{title}</Text>
      {audio ? (
        <View style={styles.audioHint}>
          <Ionicons name="volume-medium" size={14} color={slate[400]} />
          <Text style={styles.selPreview}>Audio task — listen and respond</Text>
        </View>
      ) : preview ? (
        <Text style={styles.selPreview} numberOfLines={3}>{preview}</Text>
      ) : null}
      <View style={styles.selCta}>
        <Text style={[styles.selCtaText, { color: accent }]}>Practise</Text>
        <Ionicons name="arrow-forward" size={13} color={accent} />
      </View>
    </Pressable>
  );
}

export function PromptPanel({ label, text, accent }: { label: string; text: string; accent: string }) {
  return (
    <View style={styles.promptPanel}>
      <Text style={[styles.panelLabel, { color: accent }]}>{label.toUpperCase()}</Text>
      <Text style={styles.promptText}>{text}</Text>
    </View>
  );
}

export function Textarea(props: TextInputProps & { minHeight?: number }) {
  const { style, minHeight, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={slate[400]}
      multiline
      style={[styles.textarea, { minHeight: minHeight ?? 120 }, style]}
      {...rest}
    />
  );
}

export function LiveChecks({ checks }: { checks: { ok: boolean; label: string; bad?: boolean }[] }) {
  return (
    <View style={styles.checksRow}>
      {checks.map((c, i) => (
        <View key={i} style={styles.checkItem}>
          <Ionicons
            name={c.ok ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={c.ok ? slate.emerald : c.bad ? slate.red : slate[400]}
          />
          <Text style={[styles.checkText, { color: c.ok ? slate.emerald : c.bad ? slate.red : slate[400] }]}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  accent,
  icon = 'arrow-forward',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accent: string;
  icon?: keyof typeof Ionicons.glyphMap | null;
}) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: off ? 0.5 : pressed ? 0.9 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.primaryBtnText}>{label}</Text>
          {icon ? <Ionicons name={icon} size={16} color="#fff" /> : null}
        </>
      )}
    </Pressable>
  );
}

export function DarkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.darkBtn, { opacity: pressed ? 0.9 : 1 }]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color="#fff" />
    </Pressable>
  );
}

export function AudioPlayButton({
  audioUrl,
  text,
  label = 'Play audio',
  accent,
}: {
  audioUrl?: string;
  text?: string;
  label?: string;
  accent: string;
}) {
  const playerRef = React.useRef<PromptPlayer | null>(null);
  const [state, setState] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  React.useEffect(() => {
    playerRef.current = new PromptPlayer();
    return () => {
      playerRef.current?.unload();
    };
  }, []);

  const onPress = async () => {
    const player = playerRef.current;
    if (!player) return;
    if (state === 'ready') return void player.play();
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
    <Pressable
      onPress={onPress}
      disabled={state === 'loading'}
      style={({ pressed }) => [styles.audioBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
    >
      {state === 'loading' ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Ionicons name={icon} size={20} color="#fff" />
      )}
      <Text style={styles.primaryBtnText}>
        {state === 'ready' ? 'Play again' : state === 'error' ? 'Retry audio' : label}
      </Text>
    </Pressable>
  );
}

export function CircularScore({
  value,
  max,
  label,
  pct,
  accent,
}: {
  value: number | string;
  max: number | string;
  label: string;
  pct?: number;
  accent: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={[styles.circle, { borderColor: accent }]}>
        <Text style={styles.circleLabel}>{label.toUpperCase()}</Text>
        <Text style={[styles.circleValue, { color: accent }]}>{value}</Text>
        <Text style={styles.circleMax}>/ {max}</Text>
      </View>
      {typeof pct === 'number' ? (
        <View style={[styles.pctPill, { backgroundColor: tint(accent, 0.12), borderColor: tint(accent, 0.3) }]}>
          <Text style={[styles.pctText, { color: accent }]}>{pct}%</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ScorePill({ label, value, max, accent }: { label: string; value: number | string; max: number | string; accent: string }) {
  return (
    <View style={styles.scorePill}>
      <Text style={[styles.scorePillValue, { color: accent }]}>
        {value}<Text style={styles.scorePillMax}>/{max}</Text>
      </Text>
      <Text style={styles.scorePillLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function ScoreHeaderPanel({
  accent,
  circular,
  title,
  text,
  pills,
}: {
  accent: string;
  circular: React.ReactNode;
  title?: string;
  text?: string;
  pills?: React.ReactNode;
}) {
  return (
    <View style={[styles.scoreHeader, { backgroundColor: tint(accent, 0.08), borderColor: tint(accent, 0.22) }]}>
      {circular}
      <View style={{ gap: 10, marginTop: 16 }}>
        {title ? <Text style={styles.scoreTitle}>{title}</Text> : null}
        {text ? <Text style={styles.scoreText}>{text}</Text> : null}
        {pills ? <View style={styles.pillsRow}>{pills}</View> : null}
      </View>
    </View>
  );
}

export function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionBar, { backgroundColor: accent }]} />
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      </View>
      {children}
    </View>
  );
}

export function ResultCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.resultCard, style]}>{children}</View>;
}

export function Bullets({
  items,
  tone = 'slate',
  symbol = '•',
}: {
  items?: string[];
  tone?: 'slate' | 'green' | 'red' | 'accent';
  symbol?: string;
  accent?: string;
}) {
  if (!items || items.length === 0) return null;
  const c = { slate: slate[400], green: slate.emerald, red: slate.red, accent: theme.colors.accent };
  return (
    <View style={{ gap: 6 }}>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bulletSymbol, { color: c[tone] }]}>{symbol}</Text>
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export function CorrectionRow({ error, correction, note }: { error: string; correction: string; note?: string }) {
  return (
    <ResultCard>
      <Text style={styles.correctionError}>{error}</Text>
      <Text style={styles.correctionFix}>{correction}</Text>
      {note ? <Text style={styles.correctionNote}>{note}</Text> : null}
    </ResultCard>
  );
}

type WordKind = 'correct' | 'missing' | 'incorrect' | 'misspelled' | 'extra' | 'order';
const WORD_COLORS: Record<WordKind, string> = {
  correct: slate.emerald,
  missing: slate.red,
  incorrect: slate.red,
  misspelled: '#D97706',
  extra: slate[400],
  order: '#DB2777',
};

/** Word-by-word coloured breakdown for Write from Dictation. */
export function WordChips({ analysis }: { analysis: { kind: WordKind; expected?: string; actual?: string }[] }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.chipWrap}>
        {analysis.map((t, i) => {
          const word = t.actual ?? t.expected ?? '';
          return (
            <Text
              key={i}
              style={[
                styles.wordChip,
                { color: WORD_COLORS[t.kind], borderColor: WORD_COLORS[t.kind] + '55', backgroundColor: WORD_COLORS[t.kind] + '12' },
                t.kind === 'extra' && { textDecorationLine: 'line-through' },
              ]}
            >
              {t.kind === 'missing' ? `[${word}]` : word}
            </Text>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        {[
          ['correct', slate.emerald],
          ['missing/wrong', slate.red],
          ['misspelled', '#D97706'],
          ['order', '#DB2777'],
        ].map(([label, color]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color as string }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ModelAnswer({ text, why }: { text: string; why?: string }) {
  return (
    <View style={styles.modelCard}>
      <Text style={styles.modelText}>&ldquo;{text}&rdquo;</Text>
      {why ? <Text style={styles.modelWhy}>{why}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  h1: { fontSize: 26, fontWeight: '800', color: slate[900], textAlign: 'center' },
  subtitle: { fontSize: 14, color: slate[500], textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '700' },
  selCard: { backgroundColor: slate.white, borderRadius: 22, borderWidth: 1, padding: 18, gap: 8 },
  selTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selIndex: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  selTitle: { fontSize: 16, fontWeight: '800', color: slate[800] },
  selPreview: { fontSize: 12, color: slate[500], lineHeight: 18 },
  audioHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  selCtaText: { fontSize: 12, fontWeight: '700' },
  promptPanel: { backgroundColor: slate[50], borderRadius: 22, borderWidth: 1, borderColor: slate[200], padding: 18, gap: 8 },
  panelLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  promptText: { fontSize: 15, lineHeight: 23, color: slate[700] },
  textarea: {
    backgroundColor: slate.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: slate[200],
    color: slate[900],
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  checksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkText: { fontSize: 12, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 16, paddingHorizontal: 24,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 16,
  },
  darkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 16, backgroundColor: slate[900],
  },
  circle: {
    width: 128, height: 128, borderRadius: 64, borderWidth: 4,
    backgroundColor: slate.white, alignItems: 'center', justifyContent: 'center',
  },
  circleLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: slate[400] },
  circleValue: { fontSize: 38, fontWeight: '800', marginVertical: 1 },
  circleMax: { fontSize: 10, fontWeight: '700', color: slate[400] },
  pctPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  pctText: { fontSize: 11, fontWeight: '800' },
  scoreHeader: { borderRadius: 24, borderWidth: 1, padding: 20, alignItems: 'center' },
  scoreTitle: { fontSize: 19, fontWeight: '800', color: slate[900], textAlign: 'center' },
  scoreText: { fontSize: 14, color: slate[600], lineHeight: 21, textAlign: 'center' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  scorePill: {
    backgroundColor: slate.white, borderRadius: 16, borderWidth: 1, borderColor: slate[200],
    paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', minWidth: 72, flexGrow: 1,
  },
  scorePillValue: { fontSize: 20, fontWeight: '800' },
  scorePillMax: { fontSize: 12, color: slate[400] },
  scorePillLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: slate[500], marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBar: { width: 20, height: 2, borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: slate[800] },
  resultCard: { backgroundColor: slate.white, borderRadius: 16, borderWidth: 1, borderColor: slate[200], padding: 14 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletSymbol: { fontWeight: '800', fontSize: 14 },
  bulletText: { flex: 1, fontSize: 14, color: slate[700], lineHeight: 20 },
  correctionError: { fontSize: 14, color: slate.red, textDecorationLine: 'line-through' },
  correctionFix: { fontSize: 14, color: slate.emerald, fontWeight: '600', marginTop: 2 },
  correctionNote: { fontSize: 12, color: slate[500], marginTop: 4 },
  modelCard: { backgroundColor: slate.emeraldBg, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', padding: 14 },
  modelText: { fontSize: 14, color: slate[900], fontStyle: 'italic', fontWeight: '600', lineHeight: 22 },
  modelWhy: { fontSize: 12, color: slate[600], marginTop: 8, lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordChip: { fontSize: 13, fontWeight: '600', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: slate[400] },
});
