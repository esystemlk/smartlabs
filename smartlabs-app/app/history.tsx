import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAnalytics, taskLabel, type Attempt, type SkillKey } from '@/lib/attempts';
import { ScreenHeader } from '@/ui/brand';
import { useAppLayout } from '@/ui/layout';
import { C } from '@/theme';

const SKILL_COLOR: Record<SkillKey, string> = { speaking: C.speaking, reading: C.reading, writing: C.writing, listening: C.listening };
const SKILL_ICON: Record<SkillKey, keyof typeof Ionicons.glyphMap> = { speaking: 'mic', reading: 'book', writing: 'pencil', listening: 'headset' };

type Filter = 'all' | SkillKey;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'speaking', label: 'Speaking' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'listening', label: 'Listening' },
];

/** Colour a 0–90 score: green (≥79), blue (≥65), amber (≥50), red below. */
function scoreColor(v: number): string {
  if (v >= 79) return C.success;
  if (v >= 65) return C.blue;
  if (v >= 50) return C.amber;
  return C.danger;
}

const DAY = 86400000;
const dayStamp = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function dayHeading(ms: number): string {
  const today = dayStamp(Date.now());
  const yday = dayStamp(Date.now() - DAY);
  const k = dayStamp(ms);
  if (k === today) return 'Today';
  if (k === yday) return 'Yesterday';
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Practice History — every recorded attempt, newest first, filterable by skill. */
export default function History() {
  const layout = useAppLayout();
  const router = useRouter();
  const a = useAnalytics();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    const list = [...a.attempts].sort((x, y) => y.at - x.at);
    return filter === 'all' ? list : list.filter((r) => r.skill === filter);
  }, [a.attempts, filter]);

  // Group the (already sorted desc) rows into day buckets.
  const groups = useMemo(() => {
    const out: { day: string; items: Attempt[] }[] = [];
    for (const r of rows) {
      const heading = dayHeading(r.at);
      const last = out[out.length - 1];
      if (last && last.day === heading) last.items.push(r);
      else out.push({ day: heading, items: [r] });
    }
    return out;
  }, [rows]);

  const filteredAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={[s.headerWrap, layout.content]}>
        <ScreenHeader title="Practice history" />
      </View>

      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        {/* Summary strip */}
        <View style={s.summary}>
          <Summary value={rows.length} label={rows.length === 1 ? 'attempt' : 'attempts'} />
          <View style={s.summaryDivider} />
          <Summary value={filteredAvg ?? '—'} label="avg score" tint={filteredAvg !== null ? scoreColor(filteredAvg) : C.faint} />
          <View style={s.summaryDivider} />
          <Summary value={a.streak} label="day streak" tint="#F97316" />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const color = f.key === 'all' ? C.blue : SKILL_COLOR[f.key];
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[s.chip, active && { backgroundColor: color, borderColor: color }]}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="time-outline" size={30} color={C.blue} /></View>
            <Text style={s.emptyTitle}>No attempts yet</Text>
            <Text style={s.emptyText}>
              {filter === 'all'
                ? 'Complete any practice task and it will appear here with your score.'
                : 'No attempts in this skill yet — pick it in Practice to get started.'}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/practice')} style={s.emptyBtn}>
              <Ionicons name="barbell" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Go to Practice</Text>
            </Pressable>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.day} style={{ marginTop: 18 }}>
              <Text style={s.dayHeading}>{g.day}</Text>
              <View style={s.card}>
                {g.items.map((r, i) => (
                  <Pressable
                    key={`${r.at}-${i}`}
                    onPress={() => router.push(`/section/${r.skill}`)}
                    style={[s.row, i < g.items.length - 1 && s.rowBorder]}
                  >
                    <View style={[s.rowIcon, { backgroundColor: SKILL_COLOR[r.skill] + '18' }]}>
                      <Ionicons name={SKILL_ICON[r.skill]} size={16} color={SKILL_COLOR[r.skill]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowLabel} numberOfLines={1}>{taskLabel(r.taskType)}</Text>
                      <Text style={s.rowMeta}>{clockTime(r.at)}</Text>
                    </View>
                    <View style={[s.scoreBadge, { backgroundColor: scoreColor(r.score) + '18' }]}>
                      <Text style={[s.scoreText, { color: scoreColor(r.score) }]}>{r.score}</Text>
                      <Text style={[s.scoreMax, { color: scoreColor(r.score) }]}>/90</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ value, label, tint }: { value: number | string; label: string; tint?: string }) {
  return (
    <View style={s.summaryItem}>
      <Text style={[s.summaryValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerWrap: { paddingHorizontal: 20, paddingTop: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingVertical: 16, marginTop: 6 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 34, backgroundColor: C.border },
  summaryValue: { fontSize: 22, fontWeight: '800', color: C.navy },
  summaryLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600', marginTop: 2 },

  filters: { gap: 8, paddingVertical: 16 },
  chip: { paddingHorizontal: 16, minHeight: 42, paddingVertical: 9, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '700', color: C.slate },
  chipTextActive: { color: '#fff' },

  dayHeading: { fontSize: 13, fontWeight: '800', color: C.slateLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 2 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700', color: C.navy },
  rowMeta: { fontSize: 12, color: C.slateLight, marginTop: 2 },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  scoreText: { fontSize: 16, fontWeight: '800' },
  scoreMax: { fontSize: 10, fontWeight: '700', marginLeft: 1 },

  empty: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 28, marginTop: 20 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: C.tintBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.navy },
  emptyText: { fontSize: 14, color: C.slate, textAlign: 'center', lineHeight: 21, marginTop: 6 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 18 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
