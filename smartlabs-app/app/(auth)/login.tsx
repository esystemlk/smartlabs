import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { Logo, GradientButton, AuthField } from '@/ui/brand';
import { C } from '@/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extra = (Constants.expoConfig?.extra ?? {}) as any;

// Official multicolour Google "G".
const GoogleG = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </Svg>
);

function GoogleButtonShell({ onPress, loading, disabled }: { onPress?: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.googleBtn, { opacity: disabled || loading ? 0.55 : pressed ? 0.9 : 1 }]}
    >
      {loading ? <ActivityIndicator color={C.navy} /> : (
        <>
          <GoogleG />
          <Text style={styles.googleText}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

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

/**
 * Native (Android/iOS) Google sign-in via Google Play Services — no browser
 * redirect, so it avoids the "invalid_request" the web OAuth flow hits on a
 * standalone build. The library is required lazily so it never loads on web.
 */
function NativeGoogleButton({ onError }: { onError: (m: string) => void }) {
  const { signInWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const go = async () => {
    onError('');
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: extra.googleWebClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('Google did not return an ID token.');
      await signInWithGoogleIdToken(idToken);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      // Silently ignore the user cancelling the picker.
      if (code !== 'SIGN_IN_CANCELLED' && code !== '-5' && code !== 'CANCELED') {
        onError(mapAuthError(e));
      }
    } finally {
      setLoading(false);
    }
  };
  return <GoogleButtonShell onPress={go} loading={loading} />;
}

const NATIVE_GOOGLE_READY = !!(extra.googleAndroidClientId || extra.googleIosClientId);

/** Screen 3 — Sign In. */
export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.navy} />
            </Pressable>
            <Logo height={32} />
            <View style={{ width: 38 }} />
          </View>

          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Welcome back! Continue your PTE journey.</Text>

          <View style={styles.googleWrap}>
            {Platform.OS === 'web' ? (
              <WebGoogleButton onError={(m) => setError(m || null)} />
            ) : NATIVE_GOOGLE_READY ? (
              <NativeGoogleButton onError={(m) => setError(m || null)} />
            ) : (
              <GoogleButtonShell disabled />
            )}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={{ gap: 16 }}>
            <AuthField
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="youremail@example.com"
            />
            <AuthField
              label="Password"
              icon="lock-closed-outline"
              password
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
            />

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow} hitSlop={8}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton label="Sign In" onPress={onSubmit} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8}>
              <Text style={styles.footerLink}>Create Account</Text>
            </Pressable>
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
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 26, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.navy, fontSize: 30, fontWeight: '800' },
  subtitle: { color: C.slate, fontSize: 15, marginTop: 6, marginBottom: 22 },
  googleWrap: { marginBottom: 18 },
  error: { color: C.danger, fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  divider: { flex: 1, height: 1, backgroundColor: C.borderStrong },
  dividerText: { color: C.slateLight, fontSize: 12, fontWeight: '700' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 54, borderRadius: 14, borderWidth: 1, borderColor: C.borderStrong, backgroundColor: '#fff',
  },
  googleText: { color: C.navy, fontSize: 15, fontWeight: '700' },
  forgotRow: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { color: C.blue, fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
  footerText: { color: C.slate, fontSize: 14 },
  footerLink: { color: C.blue, fontWeight: '800', fontSize: 14 },
});
