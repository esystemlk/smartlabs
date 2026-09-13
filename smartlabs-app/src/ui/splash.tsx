import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/ui/brand';

const GOLD = '#E7C874';

/**
 * Keeps the navigator (children) mounted at all times and overlays the splash
 * on top while `show` is true. Living in this normal module (not the root
 * `_layout`, which expo-router evaluates as a shallow lazy chunk on web) avoids
 * a "View is not defined" binding quirk in that root chunk.
 */
export function SplashHost({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      {show ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Splash />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Screen 1 — premium animated splash.
 *
 * A calm, editorial entrance: a soft glow breathes behind the mark, the logo
 * settles in with a gentle rise + scale, the tagline and a hairline gold rule
 * fade up, and a slim progress sweep runs along the base. Pure built-in
 * `Animated` — no extra deps, no "sparkle" clichés.
 */
export function Splash() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const ruleW = useRef(new Animated.Value(0)).current;
  const tagFade = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ruleW, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(tagFade, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ).start();
  }, [fade, rise, scale, ruleW, tagFade, glow, sweep]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  const sweepLeft = sweep.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] });

  return (
    <LinearGradient colors={['#0B1E52', '#12296B', '#0A183F']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.root}>
      {/* corner glazes for depth */}
      <View style={[s.glaze, { top: -140, right: -120, backgroundColor: 'rgba(64,110,220,0.20)' }]} />
      <View style={[s.glaze, { bottom: -160, left: -120, backgroundColor: 'rgba(20,40,110,0.35)' }]} />

      <View style={s.center}>
        <Animated.View style={[s.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }, { scale }], alignItems: 'center' }}>
          <View style={s.logoCard}>
            <Logo height={50} />
          </View>
        </Animated.View>

        <Animated.View style={[s.rule, { width: ruleW.interpolate({ inputRange: [0, 1], outputRange: [0, 64] }) }]} />

        <Animated.Text style={[s.tagline, { opacity: tagFade }]}>MASTER ENGLISH · THE SMART WAY</Animated.Text>
      </View>

      <Animated.Text style={[s.script, { opacity: tagFade }]}>Better English, Brighter Future</Animated.Text>

      {/* slim progress sweep */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressSweep, { left: sweepLeft }]} />
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glaze: { position: 'absolute', width: 320, height: 320, borderRadius: 200 },
  center: { alignItems: 'center' },
  glow: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -34,
    backgroundColor: 'rgba(120,160,255,0.35)',
  },
  logoCard: {
    backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 22, borderRadius: 22,
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 10,
  },
  rule: { height: 2, borderRadius: 1, backgroundColor: GOLD, marginTop: 26 },
  tagline: { color: 'rgba(214,226,255,0.82)', fontSize: 11.5, fontWeight: '700', letterSpacing: 2.5, marginTop: 16 },
  script: {
    position: 'absolute', bottom: 108, color: 'rgba(160,188,255,0.7)', fontSize: 15, fontStyle: 'italic', fontWeight: '500', letterSpacing: 0.3,
  },
  progressTrack: {
    position: 'absolute', bottom: 60, width: 150, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  progressSweep: { position: 'absolute', top: 0, width: '40%', height: 3, borderRadius: 2, backgroundColor: GOLD },
});
