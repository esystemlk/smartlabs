import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useCredits, type PoolStatus } from '@/credits/CreditsContext';
import { getSessions, WEEKLY_GOAL } from '@/lib/progress';

const C = { navy: '#0F1E3D', slate: '#5B6B85', slateLight: '#8A97AC', blue: '#2563EB', heroBg: '#EAF1FD', track: '#DCE6F7', border: '#EEF1F6' };

export default function Progress() {
  const { user } = useAuth();
  const credits = useCredits();
  const [sessions, setSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (user) getSessions(user.uid).then((n) => alive && setSessions(n));
      return () => { alive = false; };
    }, [user]),
  );

  const pct = Math.min(100, Math.round((sessions / WEEKLY_GOAL) * 100));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Your Progress</Text>
      <Text style={styles.sub}>Keep practising to hit your weekly goal.</Text>

      <View style={styles.hero}>
        <Text style={styles.heroBig}>{sessions}</Text>
        <Text style={styles.heroLabel}>AI practices completed</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, pct)}%` }]} /></View>
        <Text style={styles.goal}>{sessions} of {WEEKLY_GOAL} this week · {pct}%</Text>
      </View>

      <Text style={styles.section}>CREDITS</Text>
      <View style={styles.card}>
        <CreditRow icon="mic" label="Speaking" pool={credits.speaking} unlimited={credits.unlimited} />
        <CreditRow icon="headset" label="Summarize Spoken Text" pool={credits.sst} unlimited={credits.unlimited} />
        <CreditRow icon="document-text" label="Summarize Written Text" pool={credits.swt} unlimited={credits.unlimited} />
        <CreditRow icon="pencil" label="Essay" pool={credits.essay} unlimited={credits.unlimited} last />
      </View>
    </ScrollView>
  );
}

function CreditRow({ icon, label, pool, unlimited, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; pool: PoolStatus; unlimited: boolean; last?: boolean }) {
  const value = unlimited || pool.monthlyActive ? 'Unlimited' : pool.paid > 0 ? `${pool.paid} paid` : `${Math.max(0, pool.freeLimit - pool.freeUsed)} free left`;
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={16} color={C.blue} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 32 },
  h1: { fontSize: 28, fontWeight: '800', color: C.navy },
  sub: { fontSize: 14, color: C.slateLight, marginTop: 4 },
  hero: { backgroundColor: C.heroBg, borderRadius: 24, padding: 22, marginTop: 18, alignItems: 'center' },
  heroBig: { fontSize: 52, fontWeight: '800', color: C.blue },
  heroLabel: { fontSize: 14, color: C.slate, fontWeight: '600', marginTop: -2 },
  track: { width: '100%', height: 8, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden', marginTop: 16 },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.blue },
  goal: { fontSize: 13, color: C.slate, fontWeight: '600', marginTop: 10 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: C.slateLight, marginTop: 26, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.heroBg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, color: C.navy, fontWeight: '600' },
  rowValue: { fontSize: 14, color: C.blue, fontWeight: '700' },
});
