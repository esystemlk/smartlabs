import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/theme';

const SKILLS = [
  { key: 'speaking', label: 'Speaking', desc: 'Build fluency and confidence', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
  { key: 'reading', label: 'Reading', desc: 'Improve your reading skills', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
  { key: 'writing', label: 'Writing', desc: 'Develop your writing ability', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
  { key: 'listening', label: 'Listening', desc: 'Sharpen your listening skills', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
] as const;

/** Screen 8 — Practice Arena (skill picker). */
export default function Practice() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Practice Arena</Text>
        <Text style={s.sub}>Choose a skill to start practicing</Text>

        <View style={{ gap: 14, marginTop: 20 }}>
          {SKILLS.map((sk) => (
            <Pressable
              key={sk.key}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/section/${sk.key}`)}
            >
              <View style={[s.icon, { backgroundColor: sk.bg }]}>
                <Ionicons name={sk.icon} size={24} color={sk.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{sk.label}</Text>
                <Text style={s.rowDesc}>{sk.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.faint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: C.navy },
  sub: { fontSize: 15, color: C.slateLight, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff',
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border,
  },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 17, fontWeight: '800', color: C.navy },
  rowDesc: { fontSize: 13, color: C.slateLight, marginTop: 3 },
});
