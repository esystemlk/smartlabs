import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Logo, GradientButton } from '@/ui/brand';
import { C } from '@/theme';

/** Screen 5 — Email verification notice (shown right after sign-up). */
export default function VerifyEmail() {
  const { user, resendVerification, signOut } = useAuth();
  const router = useRouter();
  const [secs, setSecs] = useState(30);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSecs((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const resend = async () => {
    if (secs > 0) return;
    setNote(null);
    try {
      await resendVerification();
      setNote('Verification email sent — check your inbox.');
      setSecs(30);
    } catch {
      setNote('Could not send right now. Please try again shortly.');
    }
  };

  const backToSignIn = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Pressable onPress={backToSignIn} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.navy} />
        </Pressable>
        <Logo height={32} />
        <View style={{ width: 38 }} />
      </View>

      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="mail" size={44} color={C.blue} />
          <View style={s.check}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        </View>

        <Text style={s.title}>Verify Your Email</Text>
        <Text style={s.sub}>We've sent a verification link to</Text>
        <Text style={s.email}>{user?.email ?? 'your email'}</Text>
        <Text style={s.hint}>Please check your inbox and click the link to verify your account.</Text>

        {note ? <Text style={s.note}>{note}</Text> : null}

        <Pressable onPress={resend} disabled={secs > 0} style={[s.resend, secs > 0 && s.resendOff]}>
          <Text style={[s.resendText, secs > 0 && s.resendTextOff]}>
            {secs > 0 ? `Resend Email (${mm}:${ss})` : 'Resend Email'}
          </Text>
        </Pressable>

        <View style={{ height: 8 }} />
        <GradientButton label="Continue to App" onPress={() => router.replace('/(tabs)')} style={{ alignSelf: 'stretch' }} />

        <Pressable onPress={backToSignIn} hitSlop={8} style={{ marginTop: 18 }}>
          <Text style={s.backLink}>Back to Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 8 },
  iconWrap: {
    width: 104, height: 104, borderRadius: 34, backgroundColor: C.tintBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  check: {
    position: 'absolute', bottom: 16, right: 22, width: 26, height: 26, borderRadius: 13, backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '800', color: C.navy },
  sub: { fontSize: 14, color: C.slate, marginTop: 6 },
  email: { fontSize: 15, color: C.blue, fontWeight: '800' },
  hint: { fontSize: 14, color: C.slateLight, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  note: { fontSize: 13, color: C.success, textAlign: 'center', marginTop: 8 },
  resend: { alignSelf: 'stretch', height: 52, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  resendOff: { opacity: 1 },
  resendText: { fontSize: 15, fontWeight: '700', color: C.blue },
  resendTextOff: { color: C.slateLight },
  backLink: { fontSize: 15, fontWeight: '800', color: C.blue },
});
