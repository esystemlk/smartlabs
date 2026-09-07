import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { Button, Field } from '@/ui/components';
import { mapAuthError } from './login';
import { theme } from '@/theme';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>We'll email you a secure reset link.</Text>
          </View>

          {sent ? (
            <View style={{ gap: 16 }}>
              <Text style={styles.success}>
                If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam.
              </Text>
              <Link href="/(auth)/login" style={styles.footerLink}>
                Back to sign in
              </Link>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="Send reset link" onPress={onSubmit} loading={loading} />
              <Link href="/(auth)/login" style={styles.link}>
                Back to sign in
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 },
  title: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.body },
  error: { color: theme.colors.danger, fontSize: theme.font.small },
  success: { color: theme.colors.success, fontSize: theme.font.body, lineHeight: 22 },
  link: { color: theme.colors.accent, fontSize: theme.font.small, textAlign: 'center', fontWeight: '600' },
  footerLink: { color: theme.colors.accent, fontWeight: '700' },
});
