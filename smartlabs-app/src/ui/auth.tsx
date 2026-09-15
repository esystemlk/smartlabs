import React from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from './brand';
import { useAppLayout } from './layout';
import { C } from '@/theme';

export const STUDY_ART = require('../../assets/study-hero.png');
export function StudyArtwork({ compact = false }: { compact?: boolean }) {
  return <View style={{ width: '100%', aspectRatio: compact ? 2.4 : 1.5, borderRadius: 24, overflow: 'hidden' }}><Image source={STUDY_ART} accessibilityLabel="A student practicing English with headphones, a notebook and a laptop" resizeMode="cover" style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }} /></View>;
}
export function SkillTags() {
  return <View style={s.tags}>{[
    { icon: 'mic', label: 'Speak', color: C.speaking, bg: C.speakingBg },
    { icon: 'book', label: 'Read', color: C.reading, bg: C.readingBg },
    { icon: 'pencil', label: 'Write', color: C.writing, bg: C.writingBg },
    { icon: 'headset', label: 'Listen', color: C.listening, bg: C.listeningBg },
  ].map(item => <View key={item.label} style={[s.tag, { backgroundColor: item.bg }]}>
    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} color={item.color} size={14} />
    <Text style={[s.tagText, { color: item.color }]}>{item.label}</Text>
  </View>)}</View>;
}

/** Shared scrollable, keyboard-aware frame for authentication. */
export function AuthScreen({ title, subtitle, eyebrow, children, onBack, artwork = true }: {
  title: string; subtitle: string; eyebrow: string; children: React.ReactNode; onBack?: () => void; artwork?: boolean;
}) {
  const router = useRouter();
  const layout = useAppLayout(1100);
  return <SafeAreaView style={s.safe}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[s.scroll, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))} style={s.back}>
            <Ionicons name="arrow-back" size={20} color={C.navy} />
          </Pressable>
          <Logo height={32} /><View style={{ width: 44 }} />
        </View>
        <View style={[s.layout, layout.wide && s.wide]}>
          {artwork && <View style={[s.artPanel, layout.wide && { flex: 1 }]}>
            <StudyArtwork compact={!layout.wide} />
            {layout.wide && <View style={s.artCopy}><Text style={s.artTitle}>Your next chapter starts here.</Text><Text style={s.artSub}>Build confidence, one practice at a time.</Text><SkillTags /></View>}
          </View>}
          <View style={[s.form, layout.wide && { flex: 1 }, layout.compact && { padding: 18 }]}>
            <View style={s.eyebrow}><Ionicons name="sparkles" size={13} color={C.blue} /><Text style={s.eyebrowText}>{eyebrow}</Text></View>
            <Text style={[s.title, layout.compact && { fontSize: 28 }]}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </View>
        <Text style={s.bottom}>SMARTLABS PTE · SMALL STEPS, BIG POSSIBILITIES</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function AuthNotice({ children, success = false }: { children: React.ReactNode; success?: boolean }) {
  return <View accessibilityLiveRegion="polite" style={[s.notice, { backgroundColor: success ? C.successBg : C.dangerBg }]}>
    <Ionicons name={success ? 'checkmark-circle' : 'alert-circle'} size={18} color={success ? C.success : C.danger} />
    <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: success ? '#146344' : '#A62437' }}>{children}</Text>
  </View>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingTop: 12, paddingBottom: 24 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: { width: 44, height: 44, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  layout: { gap: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  wide: { flexDirection: 'row', alignItems: 'center', gap: 36, maxWidth: 1100, flex: 1 },
  artPanel: { minWidth: 0 },
  artCopy: { padding: 22, gap: 14 },
  artTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -1.3, color: C.navy },
  artSub: { color: C.slate, fontSize: 16, lineHeight: 25 },
  form: { minWidth: 0, backgroundColor: C.white, padding: 22, borderRadius: 28, borderWidth: 1, borderColor: C.border },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eyebrowText: { fontSize: 11, fontWeight: '800', color: C.blue, letterSpacing: 1.4, flexShrink: 1 },
  title: { color: C.navy, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: C.slate, fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 24 },
  bottom: { color: C.slate, textAlign: 'center', fontSize: 10, letterSpacing: 1, marginTop: 28 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: '700' },
  notice: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 14 },
});
