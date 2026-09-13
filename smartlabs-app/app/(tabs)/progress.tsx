import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useSkillScores, currentAverage, SKILL_ORDER, type SkillKey } from '@/lib/meta';
import { ProgressBar } from '@/ui/brand';
import { C } from '@/theme';

const TABS: { key: 'overall' | SkillKey; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'speaking', label: 'Speaking' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'listening', label: 'Listening' },
];

const SKILL_COLOR: Record<SkillKey, string> = {
  speaking: C.speaking,
  reading: C.reading,
  writing: C.writing,
  listening: C.listening,
};
const SKILL_LABEL: Record<SkillKey, string> = {
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
};

/** Screen 11 — Progress. */
export default function Progress() {
  const scores = useSkillScores();
  const [tab, setTab] = useState<'overall' | SkillKey>('overall');

  const avg = currentAverage(scores);
  const series: number[] = []; // historical trend fills in as attempts accumulate

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Your Progress</Text>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Chart card */}
        <View style={s.card}>
          <View style={s.chartHead}>
            <Text style={s.chartTitle}>Score Trend</Text>
            <View style={s.chartValuePill}>
              <Text style={s.chartValueText}>{avg ?? '—'}</Text>
            </View>
          </View>
          <TrendChart series={series} color={tab === 'overall' ? C.blue : SKILL_COLOR[tab]} />
          <View style={s.months}>
            {['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m) => (
              <Text key={m} style={s.monthText}>{m}</Text>
            ))}
          </View>
        </View>

        {/* Improvement */}
        <View style={s.improveCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.improveLabel}>Overall Improvement</Text>
            <Text style={s.improveValue}>{avg ? '+0 points' : 'No data yet'}</Text>
            <Text style={s.improveHint}>from last month</Text>
          </View>
          <View style={s.improveIcon}>
            <Ionicons name="trending-up" size={22} color={C.success} />
          </View>
        </View>

        {/* Skill performance */}
        <Text style={s.section}>Skill Performance</Text>
        <View style={s.card}>
          {SKILL_ORDER.map((k, i) => {
            const v = scores[k];
            return (
              <View key={k} style={[s.barRow, i < SKILL_ORDER.length - 1 && s.barBorder]}>
                <Text style={s.barLabel}>{SKILL_LABEL[k]}</Text>
                <View style={s.barTrack}>
                  <ProgressBar pct={v ? (v / 90) * 100 : 0} color={SKILL_COLOR[k]} />
                </View>
                <Text style={[s.barValue, { color: v ? C.navy : C.faint }]}>{v ?? '—'}</Text>
              </View>
            );
          })}
        </View>

        {!avg ? (
          <Text style={s.footHint}>Complete AI-scored practice to build your trend and skill breakdown.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Simple SVG line chart with grid; shows an empty state when there's no series. */
function TrendChart({ series, color }: { series: number[]; color: string }) {
  const W = 300;
  const H = 130;
  const pad = 8;
  const gridYs = [0.15, 0.5, 0.85];

  let points = '';
  if (series.length > 1) {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    points = series
      .map((v, i) => {
        const x = pad + (i / (series.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - min) / range) * (H - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }

  return (
    <View style={{ height: H, marginTop: 12 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {gridYs.map((g, i) => (
          <Line key={i} x1={pad} y1={H * g} x2={W - pad} y2={H * g} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />
        ))}
        {series.length > 1 ? (
          <>
            <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {series.map((v, i) => {
              const min = Math.min(...series);
              const max = Math.max(...series);
              const range = max - min || 1;
              const x = pad + (i / (series.length - 1)) * (W - pad * 2);
              const y = H - pad - ((v - min) / range) * (H - pad * 2);
              return <Circle key={i} cx={x} cy={y} r={i === series.length - 1 ? 5 : 3} fill={color} />;
            })}
          </>
        ) : null}
      </Svg>
      {series.length <= 1 ? (
        <View style={s.chartEmpty} pointerEvents="none">
          <Text style={s.chartEmptyText}>Your trend appears as you practise</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: C.navy },
  tabs: { gap: 8, paddingVertical: 16 },
  tab: { paddingHorizontal: 16, height: 34, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  tabActive: { backgroundColor: C.blue, borderColor: C.blue },
  tabText: { fontSize: 13, fontWeight: '700', color: C.slate },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  chartValuePill: { backgroundColor: C.tintBlue, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  chartValueText: { color: C.blue, fontWeight: '800', fontSize: 14 },
  chartEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { color: C.faint, fontSize: 13, fontWeight: '600' },
  months: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  monthText: { fontSize: 11, color: C.faint, fontWeight: '600' },

  improveCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 16 },
  improveLabel: { fontSize: 13, color: C.slateLight, fontWeight: '600' },
  improveValue: { fontSize: 22, color: C.success, fontWeight: '800', marginTop: 2 },
  improveHint: { fontSize: 12, color: C.faint, marginTop: 2 },
  improveIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.successBg, alignItems: 'center', justifyContent: 'center' },

  section: { fontSize: 18, fontWeight: '800', color: C.navy, marginTop: 26, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  barBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  barLabel: { width: 76, fontSize: 14, color: C.navy, fontWeight: '700' },
  barTrack: { flex: 1 },
  barValue: { width: 30, textAlign: 'right', fontSize: 15, fontWeight: '800' },
  footHint: { color: C.slateLight, fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 19 },
});
