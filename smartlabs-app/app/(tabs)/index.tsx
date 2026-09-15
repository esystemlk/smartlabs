import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useCredits } from '@/credits/CreditsContext';
import { useProfileMeta, useSkillScores, currentAverage, totalPaidCredits } from '@/lib/meta';
import { Logo, ProgressBar } from '@/ui/brand';
import { StudyArtwork } from '@/ui/auth';
import { useAppLayout } from '@/ui/layout';
import { C, GRADIENTS } from '@/theme';

const SKILLS = [
  { key: 'speaking', label: 'Speaking', desc: 'Find your voice', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
  { key: 'reading', label: 'Reading', desc: 'Read with confidence', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
  { key: 'writing', label: 'Writing', desc: 'Make every word count', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
  { key: 'listening', label: 'Listening', desc: 'Tune in to the details', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
] as const;
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
export default function Home() {
  const { user } = useAuth();
  const credits = useCredits();
  const meta = useProfileMeta();
  const scores = useSkillScores();
  const router = useRouter();
  const layout = useAppLayout();
  const firstName = (user?.displayName?.trim() || 'Learner').split(' ')[0];
  const avg = currentAverage(scores);
  const pct = avg !== null && meta.targetScore > 0 ? Math.min(100, Math.round(avg / meta.targetScore * 100)) : 0;
  const creditLabel = credits.unlimited ? 'Unlimited' : totalPaidCredits(credits).toLocaleString();
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Logo height={32} /><Pressable accessibilityRole="button" accessibilityLabel="Open your profile" style={s.avatar} onPress={() => router.push('/(tabs)/account')}><Text style={s.avatarText}>{firstName.charAt(0).toUpperCase()}</Text></Pressable></View>
      <Text style={s.greet}>{greeting()} ☀</Text>
      <Text style={s.name}>{firstName}, let’s make progress.</Text>
      <View style={[s.hero, layout.wide && { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={[s.heroArt, layout.wide && { flex: 1 }]}><StudyArtwork compact /></View>
        <View style={[s.heroCopy, layout.wide && { flex: 1 }]}>
          <Text style={s.eyebrow}>YOUR DAILY DOSE OF CONFIDENCE</Text>
          <Text style={s.heroTitle}>A little practice.{ '\n' }A world of possibilities.</Text>
          <Text style={s.heroSub}>Take one step closer to your PTE goal today.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/practice')} style={s.heroButton}><Text style={s.heroButtonText}>Let’s practice</Text><Ionicons name="arrow-forward" color={C.blue} size={18} /></Pressable>
        </View>
      </View>
      <View style={s.goalCard}>
        <View style={[s.goalRow, layout.compact && { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={s.goalItem}><View style={s.goalIcon}><Ionicons name="flag" color={C.blue} size={19} /></View><View style={{ flex: 1 }}><Text style={s.goalLabel}>Your target</Text><Text style={s.goalValue}>{meta.targetScore}<Text style={s.outOf}> / 90</Text></Text></View></View>
          <View style={s.goalItem}><View style={[s.goalIcon, { backgroundColor: C.successBg }]}><Ionicons name="trending-up" color={C.success} size={20} /></View><View style={{ flex: 1 }}><Text style={s.goalLabel}>Current average</Text><Text style={s.goalValue}>{avg ?? '—'}<Text style={s.outOf}>{avg === null ? '  Let’s begin' : ' / 90'}</Text></Text></View></View>
        </View>
        <View style={s.progress}><ProgressBar pct={pct} /><Text style={s.progressText}>{pct}% of target</Text></View>
      </View>
      <View style={s.sectionRow}><Text style={s.section}>Your practice space</Text><Ionicons name="sparkles-outline" size={20} color={C.listening} /></View>
      <View style={s.grid}>{SKILLS.map(sk => <Pressable key={sk.key} accessibilityRole="button" accessibilityLabel={`Practice ${sk.label}`} onPress={() => router.push(`/section/${sk.key}`)} style={({ pressed }) => [s.skill, { backgroundColor: sk.bg, width: layout.compact ? '100%' : layout.wide ? '23.5%' : '48%', opacity: pressed ? 0.8 : 1 }]}>
        <View style={s.skillTop}><View style={s.skillIcon}><Ionicons name={sk.icon} color={sk.fg} size={23} /></View><Ionicons name="arrow-up-outline" size={18} color={sk.fg} style={{ transform: [{ rotate: '45deg' }] }} /></View>
        <Text style={s.skillName}>{sk.label}</Text><Text style={s.skillDesc}>{sk.desc}</Text>
        <Text style={[s.skillScore, { color: sk.fg }]}>{scores[sk.key] ?? '—'}<Text style={s.scoreCaption}>{scores[sk.key] === null ? '  Start practicing' : ' / 90'}</Text></Text>
      </Pressable>)}</View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/mock')} style={{ marginTop: 22 }}>
        <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mock}>
          <View style={s.mockIcon}><Ionicons name="clipboard-outline" size={25} color="#fff" /></View>
          <View style={{ flex: 1 }}><Text style={s.mockTitle}>Meet your exam-day self</Text><Text style={s.mockSub}>Explore mock test practice</Text></View><Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
      <View style={[s.credits, layout.compact && { alignItems: 'flex-start', flexDirection: 'column' }]}>
        <View style={s.creditInfo}><View style={[s.goalIcon, { backgroundColor: C.writingBg }]}><Ionicons name="flash" size={21} color={C.writing} /></View><View style={{ flex: 1 }}><Text style={s.goalLabel}>AI credits</Text><Text style={s.creditValue}>{creditLabel}</Text></View></View>
        {!credits.unlimited && <Pressable accessibilityRole="button" onPress={() => router.push('/credits')} style={s.creditButton}><Text style={s.creditButtonText}>Top up</Text><Ionicons name="add" size={17} color={C.blue} /></Pressable>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, content: { paddingTop: 14, paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#E7E2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { fontWeight: '800', fontSize: 18, color: C.listening },
  greet: { fontSize: 14, color: C.slate }, name: { fontSize: 28, fontWeight: '800', color: C.navy, letterSpacing: -0.8, marginTop: 5, marginBottom: 20 },
  hero: { backgroundColor: '#EDEBFF', borderRadius: 28, overflow: 'hidden' }, heroArt: { minWidth: 0 },
  heroCopy: { padding: 22, minWidth: 0 }, eyebrow: { color: C.listening, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: C.navy, fontSize: 25, fontWeight: '800', letterSpacing: -0.6, marginTop: 9 },
  heroSub: { fontSize: 14, color: C.slate, marginTop: 8, lineHeight: 21 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 18, alignItems: 'center', marginTop: 18, backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 15 },
  heroButtonText: { color: C.blue, fontWeight: '800', fontSize: 14 },
  goalCard: { backgroundColor: '#fff', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, marginTop: 18 },
  goalRow: { flexDirection: 'row', gap: 16, alignItems: 'center' }, goalItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.tintBlue, justifyContent: 'center', alignItems: 'center' },
  goalLabel: { fontSize: 11, color: C.slate, fontWeight: '600' }, goalValue: { fontSize: 24, fontWeight: '800', color: C.navy, marginTop: 3 },
  outOf: { fontSize: 11, fontWeight: '500', color: C.slate },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }, progressText: { fontSize: 11, fontWeight: '600', color: C.slate },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 28, marginBottom: 14 },
  section: { fontSize: 20, fontWeight: '800', color: C.navy, flexShrink: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, skill: { flexGrow: 1, padding: 17, borderRadius: 22 },
  skillTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skillIcon: { backgroundColor: '#FFFFFFB8', width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  skillName: { fontSize: 17, fontWeight: '800', color: C.navy, marginTop: 17 },
  skillDesc: { fontSize: 11, color: C.slate, marginTop: 4, lineHeight: 17 },
  skillScore: { fontSize: 25, fontWeight: '800', marginTop: 16 }, scoreCaption: { fontSize: 10, color: C.slate, fontWeight: '600' },
  mock: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 22 },
  mockIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFFFFF24', justifyContent: 'center', alignItems: 'center' },
  mockTitle: { color: '#fff', fontSize: 17, fontWeight: '800' }, mockSub: { color: '#F0EDFF', fontSize: 12, marginTop: 5 },
  credits: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, marginTop: 18 },
  creditInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }, creditValue: { fontSize: 22, color: C.navy, fontWeight: '800', marginTop: 3 },
  creditButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, backgroundColor: C.tintBlue, paddingHorizontal: 16 },
  creditButtonText: { color: C.blue, fontSize: 13, fontWeight: '800' },
});
