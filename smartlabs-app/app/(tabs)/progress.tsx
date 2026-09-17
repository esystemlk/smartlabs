import { useAppLayout } from '@/ui/layout';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useAnalytics, weeklyTrend, taskLabel, SKILL_ORDER, type SkillKey } from '@/lib/attempts';
import { ProgressBar } from '@/ui/brand';
import { C } from '@/theme';

const TABS: { key: 'overall' | SkillKey; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'speaking', label: 'Speaking' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'listening', label: 'Listening' },
];
const SKILL_COLOR: Record<SkillKey, string> = { speaking: C.speaking, reading: C.reading, writing: C.writing, listening: C.listening };
const SKILL_LABEL: Record<SkillKey, string> = { speaking: 'Speaking', reading: 'Reading', writing: 'Writing', listening: 'Listening' };

/** Screen 11 — Progress & AI insights. */
export default function Progress() {
  const layout = useAppLayout();
  const router = useRouter();
  const a = useAnalytics();
  const [tab, setTab] = useState<'overall' | SkillKey>('overall');

  const trend = tab === 'overall' ? a.trend : weeklyTrend(a.attempts.filter((x) => x.skill === tab));
  const filled = trend.filter((t) => t.value !== null) as { label: string; value: number }[];
  const current = tab === 'overall' ? a.overall : a.skillScores[tab];
  const delta = filled.length >= 2 ? filled[filled.length - 1].value - filled[filled.length - 2].value : null;
  const color = tab === 'overall' ? C.blue : SKILL_COLOR[tab];
  const hasData = a.total > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Look how far you can go.</Text>
        <Text style={s.sub}>Every attempt is a step forward.</Text>

        {/* Stat row */}
        <View style={[s.stats, layout.compact && { flexDirection: 'column' }]}>
          <Stat icon="flame" tint="#FFF1E6" fg="#F97316" value={a.streak} label={a.streak === 1 ? 'day streak' : 'day streak'} />
          <Stat icon="checkmark-done" tint={C.successBg} fg={C.success} value={a.today} label="today" />
          <Stat icon="albums" tint={C.tintBlue} fg={C.blue} value={a.total} label="total" />
        </View>

        {a.total > 0 ? (
          <Pressable onPress={() => router.push('/history')} style={s.historyLink}>
            <Ionicons name="time-outline" size={16} color={C.blue} />
            <Text style={s.historyLinkText}>See full practice history</Text>
            <Ionicons name="chevron-forward" size={16} color={C.blue} />
          </Pressable>
        ) : null}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && { backgroundColor: color, borderColor: color }]}>
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Chart card */}
        <View style={s.card}>
          <View style={s.chartHead}>
            <Text style={s.chartTitle}>Score trend</Text>
            <View style={[s.chartValuePill, { backgroundColor: color + '18' }]}>
              <Text style={[s.chartValueText, { color }]}>{current ?? '—'}<Text style={s.outOf}> / 90</Text></Text>
            </View>
          </View>
          <TrendChart trend={trend} color={color} />
          {filled.length ? (
            <View style={s.months}>
              {trend.filter((_, i) => i % 2 === 0).map((t, i) => <Text key={i} style={s.monthText}>{t.label}</Text>)}
            </View>
          ) : null}
        </View>

        {/* Improvement */}
        <View style={[s.improveCard, delta !== null && delta < 0 && { backgroundColor: '#FFF4F4', borderColor: '#F6D5D5' }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.improveLabel}>This week vs last</Text>
            <Text style={[s.improveValue, delta !== null && delta < 0 && { color: C.danger }]}>
              {delta === null ? (hasData ? 'Keep the momentum' : 'Your first step awaits') : `${delta >= 0 ? '+' : ''}${delta} points`}
            </Text>
            <Text style={s.improveHint}>{delta === null ? 'Practice a skill to build your trend' : 'change in your average score'}</Text>
          </View>
          <View style={[s.improveIcon, delta !== null && delta < 0 && { backgroundColor: '#FFE3E3' }]}>
            <Ionicons name={delta !== null && delta < 0 ? 'trending-down' : 'trending-up'} size={22} color={delta !== null && delta < 0 ? C.danger : C.success} />
          </View>
        </View>

        {/* Skill performance */}
        <Text style={s.section}>Skill performance</Text>
        <View style={s.card}>
          {SKILL_ORDER.map((k, i) => {
            const v = a.skillScores[k];
            return (
              <Pressable key={k} onPress={() => router.push(`/section/${k}`)} style={[s.barRow, i < SKILL_ORDER.length - 1 && s.barBorder]}>
                <Text style={s.barLabel}>{SKILL_LABEL[k]}</Text>
                <View style={s.barTrack}><ProgressBar pct={v ? (v / 90) * 100 : 0} color={SKILL_COLOR[k]} /></View>
                <Text style={[s.barValue, { color: v ? C.navy : C.faint }]}>{v ?? '—'}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Focus areas (AI-style recommendations) */}
        {a.weak.length ? (
          <>
            <Text style={s.section}>Focus areas</Text>
            <Text style={s.focusIntro}>Your lowest-scoring tasks — a little practice here moves your average the most.</Text>
            <View style={{ gap: 10 }}>
              {a.weak.map((w) => (
                <View key={w.taskType} style={s.focusRow}>
                  <View style={[s.focusIcon, { backgroundColor: SKILL_COLOR[w.skill] + '18' }]}>
                    <Ionicons name="flag" size={16} color={SKILL_COLOR[w.skill]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.focusLabel}>{taskLabel(w.taskType)}</Text>
                    <Text style={s.focusMeta}>Avg {w.avg} · {w.count} {w.count === 1 ? 'attempt' : 'attempts'}</Text>
                  </View>
                  <Pressable onPress={() => router.push(`/section/${w.skill}`)} style={[s.focusBtn, { backgroundColor: SKILL_COLOR[w.skill] }]}>
                    <Text style={s.focusBtnText}>Practice</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {!hasData ? (
          <Text style={s.footHint}>Complete practice to build your trend, skill breakdown and personalised focus areas.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, tint, fg, value, label }: { icon: keyof typeof Ionicons.glyphMap; tint: string; fg: string; value: number; label: string }) {
  return (
    <View style={s.stat}>
      <View style={[s.statIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={18} color={fg} /></View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/** SVG trend chart from a weekly series (nulls = weeks with no practice). */
function TrendChart({ trend, color }: { trend: { label: string; value: number | null }[]; color: string }) {
  const W = 300, H = 130, pad = 10;
  const pts = trend
    .map((t, i) => ({ i, v: t.value }))
    .filter((p): p is { i: number; v: number } => p.v !== null);
  const xs = (i: number) => pad + (i / Math.max(1, trend.length - 1)) * (W - pad * 2);
  const ys = (v: number) => H - pad - (v / 90) * (H - pad * 2);
  const line = pts.map((p) => `${xs(p.i)},${ys(p.v)}`).join(' ');

  return (
    <View style={{ height: H, marginTop: 12 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0.15, 0.5, 0.85].map((g, i) => (
          <Line key={i} x1={pad} y1={H * g} x2={W - pad} y2={H * g} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />
        ))}
        {pts.length >= 2 ? <Polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {pts.map((p, idx) => <Circle key={idx} cx={xs(p.i)} cy={ys(p.v)} r={idx === pts.length - 1 ? 5 : 3} fill={color} />)}
      </Svg>
      {pts.length === 0 ? (
        <View style={s.chartEmpty} pointerEvents="none"><Text style={s.chartEmptyText}>Your score trend appears as you practise</Text></View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: C.navy },
  sub: { color: C.slate, fontSize: 15, lineHeight: 23, marginTop: 8 },

  historyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.tintBlue, borderRadius: 14, paddingVertical: 13, marginTop: 12 },
  historyLinkText: { fontSize: 14, fontWeight: '800', color: C.blue },

  stats: { flexDirection: 'row', gap: 12, marginTop: 18 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'flex-start' },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: C.navy, marginTop: 10 },
  statLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600' },

  tabs: { gap: 8, paddingVertical: 16 },
  tab: { paddingHorizontal: 16, minHeight: 44, paddingVertical: 10, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '700', color: C.slate },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  chartValuePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  chartValueText: { fontWeight: '800', fontSize: 15 },
  outOf: { fontSize: 11, color: C.faint, fontWeight: '700' },
  chartEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { textAlign: 'center', paddingHorizontal: 16, color: C.slate, fontSize: 13, fontWeight: '600' },
  months: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  monthText: { fontSize: 10, color: C.faint, fontWeight: '600' },

  improveCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderRadius: 22, borderWidth: 1, borderColor: '#C4EADB', padding: 20, marginTop: 16 },
  improveLabel: { fontSize: 13, color: C.slateLight, fontWeight: '600' },
  improveValue: { fontSize: 22, color: C.success, fontWeight: '800', marginTop: 2 },
  improveHint: { fontSize: 12, color: C.faint, marginTop: 2 },
  improveIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#D8F3E7', alignItems: 'center', justifyContent: 'center' },

  section: { fontSize: 18, fontWeight: '800', color: C.navy, marginTop: 26, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  barBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  barLabel: { width: 76, fontSize: 14, color: C.navy, fontWeight: '700' },
  barTrack: { flex: 1 },
  barValue: { width: 30, textAlign: 'right', fontSize: 15, fontWeight: '800' },

  focusIntro: { fontSize: 13, color: C.slateLight, marginTop: -4, marginBottom: 12, lineHeight: 19 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  focusIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  focusLabel: { fontSize: 14, fontWeight: '700', color: C.navy },
  focusMeta: { fontSize: 12, color: C.slateLight, marginTop: 2 },
  focusBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  focusBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  footHint: { color: C.slateLight, fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 19 },
});
