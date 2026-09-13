import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Logo, GradientButton, ScoreRing } from '@/ui/brand';
import { C } from '@/theme';

type SlideKey = 'score' | 'skills' | 'trend';
const SLIDES: { key: SlideKey; title: string; body: string }[] = [
  { key: 'score', title: 'AI Scoring, Instantly', body: 'Answer real exam questions and get an\nexaminer-style band score in seconds.' },
  { key: 'skills', title: 'Every PTE Task Type', body: 'Speaking, Writing, Reading & Listening —\nall in one focused practice arena.' },
  { key: 'trend', title: 'Watch Your Score Climb', body: 'Track every attempt and see exactly\nwhich skills to work on next.' },
];

/** Screen 2 — onboarding with premium product-preview hero. */
export default function Welcome() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];

  // Cross-fade the hero graphic when the slide changes.
  const fade = useRef(new Animated.Value(1)).current;
  const swap = (next: number) => {
    Animated.timing(fade, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setI(next);
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  // Gentle auto-advance.
  useEffect(() => {
    const t = setTimeout(() => swap((i + 1) % SLIDES.length), 3800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.top}>
        <Logo height={34} />
      </View>

      {/* Hero */}
      <View style={s.heroArea}>
        <LinearGradient colors={['#EDF3FE', '#F7FAFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroBg}>
          <View style={[s.blob, { top: -30, right: -20, backgroundColor: 'rgba(37,99,235,0.10)' }]} />
          <View style={[s.blob, { bottom: -34, left: -26, width: 150, height: 150, backgroundColor: 'rgba(124,58,237,0.08)' }]} />
          <Animated.View style={{ opacity: fade, width: '100%', alignItems: 'center' }}>
            {slide.key === 'score' ? <ScoreHero /> : slide.key === 'skills' ? <SkillsHero /> : <TrendHero />}
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Copy */}
      <View style={s.copy}>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.sub}>{slide.body}</Text>
        <View style={s.dots}>
          {SLIDES.map((_, idx) => (
            <Pressable key={idx} onPress={() => swap(idx)} hitSlop={8}>
              <View style={[s.dot, idx === i && s.dotActive]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <GradientButton label="Get Started" icon="arrow-forward" onPress={() => router.push('/(auth)/signup')} />
        <View style={s.signinRow}>
          <Text style={s.signinText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={8}>
            <Text style={s.signinLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ── Hero graphics: real slices of the product ─────────────────────────── */

/** Slide 1 — an AI score result card, floating, with a "+6" badge. */
function ScoreHero() {
  return (
    <View style={s.stage}>
      <View style={[s.pill, { top: 6, left: 6 }]}>
        <Ionicons name="mic" size={13} color={C.speaking} />
        <Text style={[s.pillText, { color: C.speaking }]}>Read Aloud</Text>
      </View>
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardKicker}>AI SCORE</Text>
          <View style={s.badgeDone}><Ionicons name="checkmark" size={11} color="#fff" /></View>
        </View>
        <View style={s.cardRow}>
          <ScoreRing value={79} max={90} size={82} stroke={9} color={C.blue} label="Overall" />
          <View style={{ flex: 1, gap: 9, marginLeft: 16 }}>
            <Metric label="Content" v={0.9} color={C.blue} />
            <Metric label="Fluency" v={0.78} color={C.success} />
            <Metric label="Pronunciation" v={0.84} color={C.listening} />
          </View>
        </View>
      </View>
      <View style={[s.floatBadge, { bottom: 2, right: 2 }]}>
        <Ionicons name="trending-up" size={13} color="#fff" />
        <Text style={s.floatBadgeText}>+6</Text>
      </View>
    </View>
  );
}

function Metric({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={s.metricTop}>
        <Text style={s.metricLabel}>{label}</Text>
        <Text style={[s.metricVal, { color }]}>{Math.round(v * 90)}</Text>
      </View>
      <View style={s.metricTrack}><View style={[s.metricFill, { width: `${v * 100}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

/** Slide 2 — the four skills as elevated mini cards. */
function SkillsHero() {
  const items = [
    { label: 'Speaking', icon: 'mic' as const, fg: C.speaking, bg: C.speakingBg },
    { label: 'Reading', icon: 'book' as const, fg: C.reading, bg: C.readingBg },
    { label: 'Writing', icon: 'pencil' as const, fg: C.writing, bg: C.writingBg },
    { label: 'Listening', icon: 'headset' as const, fg: C.listening, bg: C.listeningBg },
  ];
  return (
    <View style={s.skillGrid}>
      {items.map((it) => (
        <View key={it.label} style={s.skillMini}>
          <View style={[s.skillMiniIcon, { backgroundColor: it.bg }]}>
            <Ionicons name={it.icon} size={20} color={it.fg} />
          </View>
          <Text style={s.skillMiniLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Slide 3 — a rising score-trend card. */
function TrendHero() {
  const pts = [10, 34, 26, 52, 44, 70, 92];
  const W = 210, H = 74;
  const max = Math.max(...pts), min = Math.min(...pts);
  const coords = pts.map((v, idx) => {
    const x = (idx / (pts.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return { x, y };
  });
  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = coords[coords.length - 1];
  return (
    <View style={s.card}>
      <View style={s.trendHead}>
        <View>
          <Text style={s.cardKicker}>OVERALL SCORE</Text>
          <Text style={s.trendScore}>68 <Text style={s.trendArrow}>→</Text> 74</Text>
        </View>
        <View style={s.floatBadgeStatic}>
          <Ionicons name="trending-up" size={13} color="#fff" />
          <Text style={s.floatBadgeText}>+6</Text>
        </View>
      </View>
      <Svg width="100%" height={H} viewBox={`0 -6 ${W} ${H + 12}`}>
        {[0.5].map((g) => (
          <Line key={g} x1={0} y1={H * g} x2={W} y2={H * g} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />
        ))}
        <Polyline points={poly} fill="none" stroke={C.blue} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={5} fill={C.blue} stroke="#fff" strokeWidth={2} />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  top: { alignItems: 'center', paddingTop: 14, paddingBottom: 8 },

  heroArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  heroBg: { borderRadius: 30, paddingVertical: 42, paddingHorizontal: 22, alignItems: 'center', overflow: 'hidden', minHeight: 300, justifyContent: 'center' },
  blob: { position: 'absolute', width: 170, height: 170, borderRadius: 100 },
  stage: { width: '100%', alignItems: 'center', justifyContent: 'center' },

  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 18,
    shadowColor: '#1E3A8A', shadowOpacity: 0.14, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: C.slateLight },
  badgeDone: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },

  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 12, color: C.slate, fontWeight: '600' },
  metricVal: { fontSize: 12, fontWeight: '800' },
  metricTrack: { height: 6, borderRadius: 3, backgroundColor: C.track, overflow: 'hidden' },
  metricFill: { height: 6, borderRadius: 3 },

  pill: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, zIndex: 2, shadowColor: '#1E3A8A', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  pillText: { fontSize: 11, fontWeight: '800' },
  floatBadge: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.success, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, zIndex: 2, shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  floatBadgeStatic: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.success, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  floatBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', width: '100%' },
  skillMini: {
    width: '44%', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 10,
    shadowColor: '#1E3A8A', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  skillMiniIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  skillMiniLabel: { fontSize: 14, fontWeight: '800', color: C.navy },

  trendHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  trendScore: { fontSize: 26, fontWeight: '800', color: C.navy, marginTop: 4 },
  trendArrow: { color: C.slateLight },

  copy: { paddingHorizontal: 28, alignItems: 'center', gap: 10, paddingTop: 22 },
  title: { fontSize: 27, fontWeight: '800', color: C.navy, textAlign: 'center' },
  sub: { fontSize: 15, color: C.slate, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D6E0F0' },
  dotActive: { width: 22, backgroundColor: C.blue },

  footer: { paddingHorizontal: 28, paddingBottom: 10, paddingTop: 18, gap: 16 },
  signinRow: { flexDirection: 'row', justifyContent: 'center' },
  signinText: { color: C.slate, fontSize: 14 },
  signinLink: { color: C.blue, fontSize: 14, fontWeight: '800' },
});
