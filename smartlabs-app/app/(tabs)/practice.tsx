import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppLayout } from '@/ui/layout';
import { C, GRADIENTS } from '@/theme';

const SKILLS = [
  { key: 'speaking', label: 'Speaking', desc: 'Find your voice. Build fluency and speak with confidence.', tasks: 'Read aloud · Repeat sentence · Describe image', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
  { key: 'reading', label: 'Reading', desc: 'Connect the ideas and make every passage click.', tasks: 'Fill in the blanks · Reorder paragraphs · MCQ', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
  { key: 'writing', label: 'Writing', desc: 'Turn your ideas into clear, compelling English.', tasks: 'Write essay · Summarize written text', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
  { key: 'listening', label: 'Listening', desc: 'Catch the details. Understand the bigger picture.', tasks: 'Write from dictation · Summarize spoken text', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
] as const;
export default function Practice() {
  const router = useRouter();
  const layout = useAppLayout();
  const [query, setQuery] = useState('');
  const filtered = SKILLS.filter(sk => (sk.label + ' ' + sk.tasks).toLowerCase().includes(query.trim().toLowerCase()));
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={[s.content, layout.content]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>MAKE TODAY A LEARNING DAY</Text><Text style={s.title}>Find your flow.</Text><Text style={s.sub}>Four skills. Endless room to grow.</Text>
      <View style={s.search}><Ionicons name="search-outline" color={C.slate} size={21} /><TextInput accessibilityLabel="Find a skill or task" value={query} onChangeText={setQuery} placeholder="Find a skill or task" placeholderTextColor={C.slate} style={s.input} autoCorrect={false} />{query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={s.clear}><Ionicons name="close-circle" color={C.slate} size={20} /></Pressable>}</View>
      <View style={s.grid}>{filtered.map((sk, index) => <Pressable accessibilityRole="button" key={sk.key} style={({ pressed }) => [s.card, { backgroundColor: sk.bg, width: layout.wide ? '48%' : '100%', opacity: pressed ? 0.85 : 1 }]} onPress={() => router.push(`/section/${sk.key}`)}>
        <View style={s.cardTop}><View style={s.icon}><Ionicons name={sk.icon} color={sk.fg} size={28} /></View><Text style={[s.number, { color: sk.fg }]}>0{SKILLS.indexOf(sk) + 1}</Text></View>
        <Text style={s.label}>{sk.label}</Text><Text style={s.desc}>{sk.desc}</Text><Text style={s.tasks}>{sk.tasks}</Text>
        <View style={s.start}><Text style={[s.startText, { color: sk.fg }]}>Explore {sk.label.toLowerCase()}</Text><Ionicons name="arrow-forward" color={sk.fg} size={19} /></View>
      </Pressable>)}</View>
      {filtered.length === 0 && <View style={s.empty}><Ionicons name="search" size={30} color={C.listening} /><Text style={s.label}>No matching skills</Text><Text style={s.sub}>Try “speaking”, “essay” or “dictation”.</Text></View>}
      <LinearGradient colors={GRADIENTS.brand} style={s.tip}><Ionicons name="bulb-outline" color="#fff" size={24} /><View style={{ flex: 1 }}><Text style={s.tipTitle}>Small steps add up.</Text><Text style={s.tipText}>Pick one task, give it your best, then use your feedback to guide your next attempt.</Text></View></LinearGradient>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, content: { paddingTop: 28, paddingBottom: 28 },
  eyebrow: { fontSize: 10, color: C.listening, fontWeight: '800', letterSpacing: 1.5 }, title: { color: C.navy, fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 9 },
  sub: { fontSize: 15, color: C.slate, lineHeight: 23, marginTop: 7 },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', minHeight: 56, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 18, paddingHorizontal: 16, marginVertical: 24 },
  input: { minWidth: 0, flex: 1, paddingVertical: 17, fontSize: 16, color: C.navy }, clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, card: { flexGrow: 1, borderRadius: 26, padding: 23 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFFB8', justifyContent: 'center', alignItems: 'center' },
  number: { fontSize: 27, fontWeight: '800', opacity: 0.5 }, label: { color: C.navy, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 20 },
  desc: { color: C.slate, fontSize: 14, lineHeight: 22, marginTop: 7 }, tasks: { color: C.slate, fontSize: 11, lineHeight: 18, marginTop: 14 },
  start: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 22 }, startText: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  empty: { padding: 28, alignItems: 'center' }, tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 22, padding: 22, marginTop: 24 },
  tipTitle: { fontSize: 17, color: '#fff', fontWeight: '800' }, tipText: { fontSize: 13, color: '#F0EDFF', lineHeight: 21, marginTop: 6 },
});
