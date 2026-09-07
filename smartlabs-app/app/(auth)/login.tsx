import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Button, Field } from '@/ui/components';
import { theme } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extra = (Constants.expoConfig?.extra ?? {}) as any;

/** Shared Google button shell. */
function GoogleButtonShell({ onPress, loading, disabled }: { onPress?: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.googleBtn, { opacity: disabled || loading ? 0.55 : pressed ? 0.9 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.googleText}>Sign in with Google</Text>
        </>
      )}
    </Pressable>
  );
}

/** Web: Firebase popup (no client ID needed). */
function WebGoogleButton({ onError }: { onError: (m: string) => void }) {
  const { signInWithGoogleWeb } = useAuth();
  const [loading, setLoading] = useState(false);
  const go = async () => {
    onError('');
    setLoading(true);
    try {
      await signInWithGoogleWeb();
    } catch (e) {
      onError(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };
  return <GoogleButtonShell onPress={go} loading={loading} />;
}

/** Native: expo-auth-session (only mounted when a client ID is configured). */
function NativeGoogleButton({ onError }: { onError: (m: string) => void }) {
  const { signInWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: extra.googleWebClientId || undefined,
    iosClientId: extra.googleIosClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
  });
  useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      signInWithGoogleIdToken(response.params.id_token)
        .catch((e) => onError(mapAuthError(e)))
        .finally(() => setLoading(false));
    } else if (response && response.type !== 'success') {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);
  const go = async () => {
    onError('');
    setLoading(true);
    try {
      await promptAsync();
    } catch (e) {
      onError(mapAuthError(e));
      setLoading(false);
    }
  };
  return <GoogleButtonShell onPress={go} loading={loading} disabled={!request} />;
}

const NATIVE_GOOGLE_READY = !!(extra.googleAndroidClientId || extra.googleIosClientId);

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
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
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SL</Text>
            </View>
            <Text style={styles.title}>SmartLabs PTE</Text>
            <Text style={styles.subtitle}>AI practice & scoring — same account as the web.</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Sign in" onPress={onSubmit} loading={loading} />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {Platform.OS === 'web' ? (
              <WebGoogleButton onError={(m) => setError(m || null)} />
            ) : NATIVE_GOOGLE_READY ? (
              <NativeGoogleButton onError={(m) => setError(m || null)} />
            ) : (
              <GoogleButtonShell disabled />
            )}

            <Link href="/(auth)/forgot-password" style={styles.link}>
              Forgot your password?
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to SmartLabs? </Text>
            <Link href="/(auth)/signup" style={styles.footerLink}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function mapAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again shortly.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email.';
    case 'auth/weak-password':
      return 'Choose a password of at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return (e as Error)?.message ?? 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 },
  brand: { alignItems: 'center', gap: 10 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: theme.colors.onAccent, fontSize: 26, fontWeight: '800' },
  title: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.body, textAlign: 'center' },
  error: { color: theme.colors.danger, fontSize: theme.font.small },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textFaint, fontSize: theme.font.small, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  googleText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  link: { color: theme.colors.accent, fontSize: theme.font.small, textAlign: 'center', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: theme.colors.textMuted },
  footerLink: { color: theme.colors.accent, fontWeight: '700' },
});
