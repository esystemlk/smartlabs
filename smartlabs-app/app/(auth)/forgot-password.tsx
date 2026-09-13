import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Logo, GradientButton, AuthField } from '@/ui/brand';
import { mapAuthError } from './login';
import { C } from '@/theme';

/** Screen 6 — Forgot Password. */
export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim()) return setError('Enter your email.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.navy} />
          </Pressable>
          <Logo height={32} />
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Forgot Password?</Text>
          <Text style={s.sub}>No worries! Enter your email and we'll send you a reset link.</Text>

          {sent ? (
            <View style={{ gap: 18, marginTop: 26 }}>
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={22} color={C.success} />
                <Text style={s.successText}>
                  If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam.
                </Text>
              </View>
              <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignSelf: 'center' }}>
                <Text style={s.backLink}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 18, marginTop: 26 }}>
              <AuthField
                label="Email Address"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="youremail@example.com"
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <GradientButton label="Send Reset Link" onPress={onSubmit} loading={loading} />
              <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignSelf: 'center' }}>
                <Text style={s.backLink}>Back to Sign In</Text>
              </Pressable>
            </View>
          )}

          <Text style={s.script}>Small Steps{'\n'}Big Results</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, padding: 26, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '800', color: C.navy },
  sub: { fontSize: 15, color: C.slate, marginTop: 8, lineHeight: 22 },
  error: { color: C.danger, fontSize: 13 },
  backLink: { color: C.blue, fontWeight: '800', fontSize: 15 },
  successBox: { flexDirection: 'row', gap: 12, backgroundColor: C.successBg, borderRadius: 14, padding: 16 },
  successText: { flex: 1, color: '#0F6B3D', fontSize: 14, lineHeight: 20 },
  script: { marginTop: 60, alignSelf: 'flex-end', color: '#C7D6EE', fontSize: 24, fontStyle: 'italic', fontWeight: '700', textAlign: 'right', lineHeight: 30 },
});
