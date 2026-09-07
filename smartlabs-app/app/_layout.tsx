import React, { useEffect } from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { CreditsProvider } from '@/credits/CreditsContext';
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

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }
  return <>{children}</>;
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
