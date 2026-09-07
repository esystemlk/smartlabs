import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/auth/AuthContext';
import { Button, Field } from '@/ui/components';
import { theme } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extra = (Constants.expoConfig?.extra ?? {}) as any;

// Official multicolour Google "G" (matches the website's google-logo.svg).
const GoogleG = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </Svg>
);

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
          <GoogleG />
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
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="SmartLabs"
            />
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
  logo: { width: 200, height: 72 },
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
