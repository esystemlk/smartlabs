import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/ui/brand';
import { C } from '@/theme';

const MOCKS = [
  { label: 'PTE Full Mock Test', meta: '2 hrs · all four skills', icon: 'clipboard' as const, fg: C.speaking, bg: C.speakingBg, featured: true },
  { label: 'Mini Mock', meta: '30–45 min', icon: 'timer' as const, fg: C.reading, bg: C.readingBg },
  { label: 'Speaking Mock', meta: 'Speaking only', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
  { label: 'Reading Mock', meta: 'Reading only', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
  { label: 'Writing Mock', meta: 'Writing only', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
  { label: 'Listening Mock', meta: 'Listening only', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
];

/** Mock Tests tab — Phase-2 catalogue (scoring engine wired later). */
export default function Mock() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <ScreenHeader title="Mock Tests" />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>Full exam-style practice under real timing</Text>

        <View style={s.soon}>
          <Ionicons name="sparkles" size={16} color={C.blue} />
          <Text style={s.soonText}>Scored mocks arrive in the next update — the catalogue is ready.</Text>
        </View>

        <View style={{ gap: 12, marginTop: 18 }}>
          {MOCKS.map((m) => (
            <Pressable key={m.label} style={[s.row, m.featured && s.rowFeatured]}>
              <View style={[s.icon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={22} color={m.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{m.label}</Text>
                <Text style={s.rowMeta}>{m.meta}</Text>
              </View>
              <View style={s.soonPill}><Text style={s.soonPillText}>Soon</Text></View>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>Previous Tests</Text>
        <View style={s.emptyCard}>
          <Ionicons name="document-text-outline" size={26} color={C.faint} />
          <Text style={s.emptyText}>No mock tests taken yet.{'\n'}Your score reports will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerWrap: { paddingHorizontal: 20, paddingTop: 4 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 28 },
  sub: { fontSize: 15, color: C.slateLight, marginTop: 2 },
  soon: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.tintBlue, borderRadius: 14, padding: 14, marginTop: 16 },
  soonText: { flex: 1, color: C.blueDeep, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16,
  },
  rowFeatured: { borderColor: C.speaking + '55', backgroundColor: '#fff' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '800', color: C.navy },
  rowMeta: { fontSize: 13, color: C.slateLight, marginTop: 2 },
  soonPill: { backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  soonPillText: { fontSize: 11, fontWeight: '800', color: C.slateLight },
  section: { fontSize: 18, fontWeight: '800', color: C.navy, marginTop: 26, marginBottom: 12 },
  emptyCard: { alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', paddingVertical: 28 },
  emptyText: { color: C.slateLight, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
