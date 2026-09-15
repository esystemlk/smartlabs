import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { GradientButton, AuthField } from '@/ui/brand';
import { mapAuthError } from './login';
import { C } from '@/theme';
import { AuthScreen, AuthNotice } from '@/ui/auth';

/** Screen 4 — Create Account. */
export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!email.trim()) return setError('Enter your email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (!agree) return setError('Please accept the Terms of Service and Privacy Policy.');
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      // Signed in now; the auth gate keeps this verification screen visible.
      router.replace('/(auth)/verify-email');
    } catch (e) {
      setError(mapAuthError(e));
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Your journey starts here." subtitle="Create your SmartLabs account and make room for your next big goal." eyebrow="LET’S MAKE PROGRESS">
          <View style={{ gap: 16 }}>
            <AuthField label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Enter your full name" />
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
            <AuthField label="Password" icon="lock-closed-outline" password value={password} onChangeText={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />

            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={styles.termsRow} onPress={() => setAgree((v) => !v)}>
              <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            {error ? <AuthNotice>{error}</AuthNotice> : null}

            <GradientButton label="Create Account" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: C.blue, borderColor: C.blue },
  termsText: { flex: 1, color: C.slate, fontSize: 13, lineHeight: 19 },
  termsLink: { color: C.blue, fontWeight: '700' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', rowGap: 8, marginTop: 24 },
  footerText: { color: C.slate, fontSize: 14 },
  footerLink: { color: C.blue, fontWeight: '800', fontSize: 14 },
});
