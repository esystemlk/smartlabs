import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useCredits } from '@/credits/CreditsContext';
import { useProfileMeta, useSkillScores, currentAverage, totalPaidCredits } from '@/lib/meta';
import { Logo, ProgressBar } from '@/ui/brand';
import { C } from '@/theme';

const SKILLS = [
  { key: 'speaking', label: 'Speaking', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
  { key: 'reading', label: 'Reading', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
  { key: 'writing', label: 'Writing', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
  { key: 'listening', label: 'Listening', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

/** Screen 7 — Home dashboard. */
export default function Home() {
  const { user } = useAuth();
  const credits = useCredits();
  const meta = useProfileMeta();
  const scores = useSkillScores();
  const router = useRouter();

  const firstName = (user?.displayName ?? 'there').split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  const avg = currentAverage(scores);
  const pct = avg ? Math.round((avg / meta.targetScore) * 100) : 0;
  const paid = totalPaidCredits(credits);
  const creditLabel = credits.unlimited ? 'Unlimited' : paid.toLocaleString();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Navy header */}
      <LinearGradient colors={['#123A86', '#0F2E6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Logo height={30} />
        <View style={s.headerRight}>
          <Pressable style={s.bell} hitSlop={8}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <View style={s.dot} />
          </Pressable>
          <Pressable style={s.avatar} onPress={() => router.push('/(tabs)/account')}>
            <Text style={s.avatarText}>{initial}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.greet}>{greeting()}</Text>
        <View style={s.nameRow}>
          <Text style={s.name}>{firstName}</Text>
          <MaterialCommunityIcons name="hand-wave" size={22} color={C.amber} />
        </View>
        <Text style={s.sub}>Ready to practice today?</Text>

        {/* Target / average card */}
        <View style={s.goalCard}>
          <View style={s.goalRow}>
            <View style={s.goalItem}>
              <View style={s.goalIcon}><Ionicons name="flag" size={16} color={C.blue} /></View>
              <View>
                <Text style={s.goalLabel}>PTE Target</Text>
                <Text style={s.goalValue}>{meta.targetScore}</Text>
              </View>
            </View>
            <View style={s.goalDivider} />
            <View style={s.goalItem}>
              <View style={[s.goalIcon, { backgroundColor: C.successBg }]}><Ionicons name="trending-up" size={16} color={C.success} /></View>
              <View>
                <Text style={s.goalLabel}>Current Avg.</Text>
                <Text style={s.goalValue}>{avg ?? '—'}</Text>
              </View>
            </View>
          </View>
          <View style={s.goalProgress}>
            <ProgressBar pct={pct} />
            <Text style={s.goalPct}>{pct}%</Text>
          </View>
        </View>

        {/* Continue practicing */}
        <Text style={s.section}>Continue Practicing</Text>
        <View style={s.grid}>
          {SKILLS.map((sk) => {
            const score = scores[sk.key];
            return (
              <Pressable key={sk.key} style={s.skillCard} onPress={() => router.push(`/section/${sk.key}`)}>
                <View style={[s.skillIcon, { backgroundColor: sk.bg }]}>
                  <Ionicons name={sk.icon} size={20} color={sk.fg} />
                </View>
                <Text style={s.skillLabel}>{sk.label}</Text>
                <Text style={[s.skillScore, { color: sk.fg }]}>{score ?? '—'}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Mock Tests */}
        <Pressable style={s.mockCard} onPress={() => router.push('/mock')}>
          <View style={s.mockIcon}><Ionicons name="clipboard" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.mockTitle}>Mock Tests</Text>
            <Text style={s.mockSub}>Full exam-style practice under real timing</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* AI Credits */}
        <View style={s.creditCard}>
          <View style={s.creditLeft}>
            <View style={s.creditIcon}><Ionicons name="flash" size={20} color="#fff" /></View>
            <View>
              <Text style={s.creditLabel}>AI Credits</Text>
              <Text style={s.creditValue}>{creditLabel}</Text>
            </View>
          </View>
          {!credits.unlimited ? (
            <Pressable style={s.buyBtn} onPress={() => router.push('/credits')}>
              <Text style={s.buyText}>Buy Credits</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2E6E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bell: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F87171', borderWidth: 1.5, borderColor: '#123A86' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  screen: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20, paddingBottom: 28 },
  greet: { fontSize: 15, color: C.slate, fontWeight: '500' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  name: { fontSize: 28, fontWeight: '800', color: C.navy },
  sub: { fontSize: 14, color: C.slateLight, marginTop: 4 },

  goalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 18, borderWidth: 1, borderColor: C.border },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.tintBlue, alignItems: 'center', justifyContent: 'center' },
  goalDivider: { width: 1, height: 38, backgroundColor: C.border, marginHorizontal: 8 },
  goalLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600' },
  goalValue: { fontSize: 22, color: C.navy, fontWeight: '800' },
  goalProgress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  goalPct: { fontSize: 13, fontWeight: '800', color: C.navy },

  section: { fontSize: 18, fontWeight: '800', color: C.navy, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  skillCard: {
    width: '47.5%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  skillIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  skillLabel: { fontSize: 14, fontWeight: '700', color: C.navy, flex: 1 },
  skillScore: { fontSize: 22, fontWeight: '800' },

  mockCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.blueDeep,
    borderRadius: 18, padding: 16, marginTop: 18,
  },
  mockIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  mockTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  mockSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  creditCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 18, borderWidth: 1, borderColor: C.border,
  },
  creditLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creditIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  creditLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600' },
  creditValue: { fontSize: 20, color: C.navy, fontWeight: '800' },
  buyBtn: { backgroundColor: C.tintBlue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  buyText: { color: C.blue, fontSize: 13, fontWeight: '800' },
});
