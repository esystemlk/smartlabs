import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { GradientButton, AuthField } from '@/ui/brand';
import { mapAuthError } from './login';
import { C } from '@/theme';
import { AuthScreen, AuthNotice } from '@/ui/auth';

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
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Let’s get you back in." subtitle="Enter your email and we’ll send a link to reset your password." eyebrow="A FRESH START" artwork={false} onBack={() => router.replace('/(auth)/login')}>
          {sent ? (
            <View style={{ gap: 18, marginTop: 26 }}>
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={22} color={C.success} />
                <Text style={s.successText}>
                  If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam.
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignSelf: 'center' }}>
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
              autoComplete="email"
              autoCorrect={false}
                placeholder="youremail@example.com"
              />
              {error ? <AuthNotice>{error}</AuthNotice> : null}
              <GradientButton label="Send Reset Link" onPress={onSubmit} loading={loading} />
              <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignSelf: 'center' }}>
                <Text style={s.backLink}>Back to Sign In</Text>
              </Pressable>
            </View>
          )}

    </AuthScreen>
  );
}

const s = StyleSheet.create({
  backLink: { color: C.blue, fontWeight: '800', fontSize: 15 },
  successBox: { flexDirection: 'row', gap: 12, backgroundColor: C.successBg, borderRadius: 14, padding: 16 },
  successText: { flex: 1, color: '#0F6B3D', fontSize: 14, lineHeight: 20 },
});
