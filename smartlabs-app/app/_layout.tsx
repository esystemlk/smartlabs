import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { CreditsProvider } from '@/credits/CreditsContext';
import { SplashHost } from '@/ui/splash';
import { theme } from '@/theme';

/** A consistent header back / close control for pushed screens. */
function HeaderBack({ label = 'Back', close = false }: { label?: string; close?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      hitSlop={10}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 2, opacity: pressed ? 0.6 : 1, paddingRight: 8 })}
    >
      <Ionicons name={close ? 'close' : 'chevron-back'} size={22} color={theme.colors.accent} />
      <Text style={{ color: theme.colors.accent, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // Hold the splash for a minimum beat so its entrance animation is seen,
  // even when Firebase resolves auth almost instantly.
  const [minElapsed, setMinElapsed] = React.useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Wait until auth resolves. The navigator (Stack) is always mounted below,
    // so the redirect is safe; the splash is only a visual overlay.
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    // Newly-signed-up users stay on the verification screen even though they're
    // already authenticated; every other auth-group route bounces to the tabs.
    const onVerify = segments[segments.length - 1] === 'verify-email';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup && !onVerify) {
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments]);

  // Keep the navigator mounted the whole time; overlay the splash on top so the
  // brand animation shows without unmounting the Stack (which would make the
  // redirect effect fire before the navigator exists).
  return <SplashHost show={initializing || !minElapsed}>{children}</SplashHost>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CreditsProvider>
          <AuthGate>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.accent,
                headerTitleStyle: { color: theme.colors.text, fontWeight: '800' },
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: theme.colors.bg },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="mock" options={{ headerShown: false }} />
              <Stack.Screen name="section/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="practice/[taskType]"
                options={{ title: 'Practice', headerLeft: () => <HeaderBack label="Practice" /> }}
              />
              <Stack.Screen
                name="credits"
                options={{ title: 'Buy credits', presentation: 'modal', headerLeft: () => <HeaderBack label="Close" close /> }}
              />
            </Stack>
          </AuthGate>
        </CreditsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
