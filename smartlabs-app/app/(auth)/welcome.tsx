import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo, GradientButton } from '@/ui/brand';
import { StudyArtwork, SkillTags } from '@/ui/auth';
import { useAppLayout } from '@/ui/layout';
import { C } from '@/theme';

const SLIDES = [
  { title: 'Big dreams.\nBrighter possibilities.', body: 'Make your next move with confidence. Your personal PTE practice space is ready when you are.', label: 'YOUR FUTURE STARTS HERE' },
  { title: 'Four skills.\nOne confident you.', body: 'Find your flow in speaking, reading, writing and listening. Practice at your pace, wherever life takes you.', label: 'A LITTLE PRACTICE, EVERY DAY' },
  { title: 'Practice with purpose.\nGrow with feedback.', body: 'Get AI feedback on your answers and discover what to work on next. Turn small steps into meaningful progress.', label: 'MAKE EVERY ATTEMPT COUNT' },
];
export default function Welcome() {
  const router = useRouter();
  const layout = useAppLayout(1100);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={[s.scroll, layout.content]} showsVerticalScrollIndicator={false}>
      <View style={s.header}><Logo height={34} /><View style={s.pte}><Text style={s.pteText}>PTE PRACTICE</Text></View></View>
      <View style={[s.main, layout.wide && s.wide]}>
        <View style={[s.visual, layout.wide && { flex: 1.1 }]}>
          <StudyArtwork />
          <View style={s.caption}><View style={s.spark}><Ionicons name="sparkles" size={20} color={C.blue} /></View><View style={{ flex: 1 }}><Text style={s.captionTitle}>A smarter way to practice</Text><Text style={s.captionBody}>Your ambition. Your pace. Your journey.</Text></View></View>
        </View>
        <View style={[s.copy, layout.wide && { flex: 1 }]}>
          <Text style={s.eyebrow}>{slide.label}</Text>
          <Text style={[s.title, { fontSize: layout.compact ? 32 : layout.wide ? 44 : 38 }]}>{slide.title}</Text>
          <Text style={s.body}>{slide.body}</Text>
          <SkillTags />
          <View style={s.steps}>
            <View style={s.dots}>{SLIDES.map((_, i) => <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Introduction ${i + 1} of 3`} accessibilityState={{ selected: i === index }} onPress={() => setIndex(i)} style={s.dotTouch}><View style={[s.dot, i === index && s.activeDot]} /></Pressable>)}</View>
            <Pressable accessibilityRole="button" accessibilityLabel="Next introduction" onPress={() => setIndex((index + 1) % SLIDES.length)} style={s.next}><Ionicons name="arrow-forward" color={C.blue} size={21} /></Pressable>
          </View>
          <GradientButton label="Start my journey" icon="arrow-forward" onPress={() => router.push('/(auth)/signup')} />
          <View style={s.signin}><Text style={s.bodySmall}>Already part of SmartLabs?</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')} style={s.signinButton}><Text style={s.link}>Sign in</Text></Pressable></View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  pte: { backgroundColor: '#E9E6FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  pteText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: C.listening },
  main: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 26, flexGrow: 1, justifyContent: 'center' },
  wide: { flexDirection: 'row', alignItems: 'center', maxWidth: 1100, gap: 44 },
  visual: { minWidth: 0 }, copy: { minWidth: 0 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12, marginTop: -18, backgroundColor: C.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#413799', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  spark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.tintBlue, justifyContent: 'center', alignItems: 'center' },
  captionTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  captionBody: { fontSize: 11, color: C.slate, marginTop: 3, lineHeight: 16 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: C.blue, letterSpacing: 1.6, marginBottom: 12 },
  title: { fontWeight: '800', letterSpacing: -1.5, color: C.navy },
  body: { color: C.slate, fontSize: 15, lineHeight: 24, marginTop: 14, marginBottom: 20 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  dots: { flexDirection: 'row' },
  dotTouch: { minWidth: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#CBCFE5' },
  activeDot: { width: 25, backgroundColor: C.blue },
  next: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  signin: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  bodySmall: { color: C.slate, fontSize: 13 },
  signinButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 },
  link: { color: C.blue, fontSize: 14, fontWeight: '800' },
});
