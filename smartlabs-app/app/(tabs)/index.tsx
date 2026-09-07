import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { getSessions, WEEKLY_GOAL } from '@/lib/progress';

const C = {
  bg: '#FFFFFF',
  navy: '#0F1E3D',
  slate: '#5B6B85',
  slateLight: '#8A97AC',
  blue: '#2563EB',
  blueDeep: '#1D4ED8',
  heroBg: '#EAF1FD',
  track: '#DCE6F7',
  border: '#EEF1F6',
};

const SKILLS = [
  { key: 'speaking', label: 'Speaking', desc: 'Practice with real exam questions', icon: 'document-text' as const, fg: '#2563EB', iconBg: '#DBE7FE', cardBg: '#EEF4FE' },
  { key: 'listening', label: 'Listening', desc: 'Improve your listening skills', icon: 'headset' as const, fg: '#E29A0B', iconBg: '#FDECC4', cardBg: '#FEF7E8' },
  { key: 'reading', label: 'Reading', desc: 'Build your reading accuracy', icon: 'book' as const, fg: '#16A34A', iconBg: '#CDF3DA', cardBg: '#EAF9EF' },
  { key: 'writing', label: 'Writing', desc: 'Get better with structured practice', icon: 'pencil' as const, fg: '#7C3AED', iconBg: '#E7DEFC', cardBg: '#F2EEFE' },
];

const BOOKS = [
  { label: 'LISTENING', color: '#2563EB' },
  { label: 'READING', color: '#F5B301' },
  { label: 'SPEAKING', color: '#2563EB' },
  { label: 'WRITING', color: '#1D4ED8' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 18) return 'Good Afternoon,';
  return 'Good Evening,';
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const firstName = (user?.displayName ?? 'there').split(' ')[0];
  const [sessions, setSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (user) getSessions(user.uid).then((n) => alive && setSessions(n));
      return () => {
        alive = false;
      };
    }, [user]),
  );

  const pct = Math.min(100, Math.round((sessions / WEEKLY_GOAL) * 100));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.topRight}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.blue} />
            <View style={styles.dot} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/account')}>
            <Ionicons name="person" size={20} color={C.blue} />
          </Pressable>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greet}>{greeting()}</Text>
      <Text style={styles.name}>Hi {firstName} 👋</Text>
      <Text style={styles.sub}>Let's make progress today.{'\n'}Your PTE journey is just a step away!</Text>

      {/* Hero card */}
      <Pressable style={styles.hero} onPress={() => router.push('/(tabs)/practice')}>
        <View style={styles.heroLeft}>
          <View style={styles.heroPill}><Text style={styles.heroPillText}>Your Learning Journey</Text></View>
          <Text style={styles.heroTitle}>PTE Academic</Text>
          <Text style={styles.heroDesc}>Practice smart. Improve daily.{'\n'}Achieve your target score.</Text>
          <View style={styles.progressRow}>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(6, pct)}%` }]} /></View>
            <Text style={styles.pctText}>{pct}%</Text>
          </View>
          <View style={styles.mockRow}>
            <View style={styles.mockIcon}><Ionicons name="disc-outline" size={16} color={C.blue} /></View>
            <View>
              <Text style={styles.mockLabel}>Practices completed</Text>
              <Text style={styles.mockValue}>{sessions} of {WEEKLY_GOAL} this week</Text>
            </View>
          </View>
        </View>
        <View style={styles.books}>
          {BOOKS.map((b, i) => (
            <View key={b.label} style={[styles.book, { backgroundColor: b.color, marginLeft: i * 6 }]}>
              <Text style={styles.bookText}>{b.label}</Text>
            </View>
          ))}
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.slateLight} style={styles.heroChevron} />
      </Pressable>

      {/* Quick Access */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <Pressable style={styles.seeAll} onPress={() => router.push('/(tabs)/practice')}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={15} color={C.blue} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {SKILLS.map((s) => (
          <Pressable key={s.key} style={[styles.skillCard, { backgroundColor: s.cardBg }]} onPress={() => router.push('/(tabs)/practice')}>
            <View style={[styles.skillIcon, { backgroundColor: s.iconBg }]}>
              <Ionicons name={s.icon} size={22} color={s.fg} />
            </View>
            <Text style={styles.skillLabel}>{s.label}</Text>
            <Text style={styles.skillDesc}>{s.desc}</Text>
            <View style={styles.skillArrow}><Ionicons name="arrow-forward" size={16} color={s.fg} /></View>
          </Pressable>
        ))}
      </View>

      {/* Start practising banner */}
      <Pressable style={styles.cta} onPress={() => router.push('/(tabs)/practice')}>
        <Ionicons name="disc-outline" size={30} color="#fff" style={{ opacity: 0.9 }} />
        <View style={styles.ctaDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaSmall}>Ready to improve?</Text>
          <Text style={styles.ctaBig}>Start Practising</Text>
        </View>
        <View style={styles.ctaArrow}><Ionicons name="arrow-forward" size={20} color={C.blue} /></View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 32 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  logo: { width: 150, height: 44 },
  topRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EAF1FD', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#EAF1FD' },
  greet: { fontSize: 18, color: C.slate, fontWeight: '500' },
  name: { fontSize: 34, fontWeight: '800', color: C.navy, marginTop: 2 },
  sub: { fontSize: 15, color: C.slateLight, marginTop: 8, lineHeight: 22 },

  hero: { backgroundColor: C.heroBg, borderRadius: 24, padding: 20, marginTop: 20, overflow: 'hidden' },
  heroLeft: { paddingRight: 90 },
  heroPill: { alignSelf: 'flex-start', backgroundColor: '#D7E5FB', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  heroPillText: { color: C.blueDeep, fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: C.navy, marginTop: 12 },
  heroDesc: { fontSize: 14, color: C.slate, marginTop: 6, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.blue },
  pctText: { fontSize: 15, fontWeight: '800', color: C.navy },
  mockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  mockIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  mockLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600' },
  mockValue: { fontSize: 14, color: C.navy, fontWeight: '700' },
  books: { position: 'absolute', right: 16, top: 54, gap: 7 },
  book: { width: 110, height: 22, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, transform: [{ skewX: '-8deg' }] },
  bookText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  heroChevron: { position: 'absolute', right: 18, bottom: 18 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: C.navy },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: C.blue, fontSize: 14, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  skillCard: { width: '47%', flexGrow: 1, borderRadius: 20, padding: 16, minHeight: 150 },
  skillIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  skillLabel: { fontSize: 17, fontWeight: '800', color: C.navy, marginTop: 14 },
  skillDesc: { fontSize: 13, color: C.slate, marginTop: 4, lineHeight: 18 },
  skillArrow: { position: 'absolute', right: 14, bottom: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  cta: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.blue, borderRadius: 20, padding: 20, marginTop: 20 },
  ctaDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.35)' },
  ctaSmall: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  ctaBig: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  ctaArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
