import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Logo, GradientButton, AuthField } from '@/ui/brand';
import { mapAuthError } from './login';
import { C } from '@/theme';

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
      await signUp(name, email, password);
      // Signed in now; the auth gate keeps this verification screen visible.
      router.replace('/(auth)/verify-email');
    } catch (e) {
      setError(mapAuthError(e));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.navy} />
            </Pressable>
            <Logo height={32} />
            <View style={{ width: 38 }} />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of students achieving their PTE goals.</Text>

          <View style={{ gap: 16 }}>
            <AuthField label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Enter your full name" />
            <AuthField
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="youremail@example.com"
            />
            <AuthField label="Password" icon="lock-closed-outline" password value={password} onChangeText={setPassword} placeholder="Create a password" />

            <Pressable style={styles.termsRow} onPress={() => setAgree((v) => !v)}>
              <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton label="Create Account" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 26, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.navy, fontSize: 28, fontWeight: '800' },
  subtitle: { color: C.slate, fontSize: 15, marginTop: 6, marginBottom: 22 },
  error: { color: C.danger, fontSize: 13 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderStrong,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: C.blue, borderColor: C.blue },
  termsText: { flex: 1, color: C.slate, fontSize: 13, lineHeight: 19 },
  termsLink: { color: C.blue, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: C.slate, fontSize: 14 },
  footerLink: { color: C.blue, fontWeight: '800', fontSize: 14 },
});
