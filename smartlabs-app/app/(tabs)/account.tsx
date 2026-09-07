import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { useCredits } from '@/credits/CreditsContext';
import { Button, Card } from '@/ui/components';
import { API_BASE_URL } from '@/config';
import { theme } from '@/theme';

export default function Account() {
  const { user, signOut } = useAuth();
  const credits = useCredits();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <Card style={{ gap: 6 }}>
        <Text style={styles.name}>{user?.displayName ?? 'Student'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Role: {credits.role}</Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={styles.cardTitle}>Credits</Text>
        <Row label="Speaking" value={fmt(credits.speaking, credits.unlimited)} />
        <Row label="Summarize Spoken Text" value={fmt(credits.sst, credits.unlimited)} />
        <Row label="Summarize Written Text" value={fmt(credits.swt, credits.unlimited)} />
        <Row label="Essay" value={fmt(credits.essay, credits.unlimited)} />
        {!credits.unlimited ? <Button label="Buy more credits" variant="ghost" onPress={() => router.push('/credits')} /> : null}
      </Card>

      <Text style={styles.hint}>Backend: {API_BASE_URL}</Text>

      <Button label="Sign out" variant="danger" onPress={signOut} />
    </ScrollView>
  );
}

function fmt(p: { paid: number; freeLimit: number; freeUsed: number; monthlyActive: boolean }, unlimited: boolean) {
  if (unlimited || p.monthlyActive) return 'Unlimited';
  if (p.paid > 0) return `${p.paid} paid`;
  return `${Math.max(0, p.freeLimit - p.freeUsed)} free left`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  name: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800' },
  email: { color: theme.colors.textMuted, fontSize: theme.font.body },
  role: { color: theme.colors.textFaint, fontSize: theme.font.small, marginTop: 4 },
  cardTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: theme.colors.textMuted, fontSize: theme.font.body },
  rowValue: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' },
  hint: { color: theme.colors.textFaint, fontSize: theme.font.tiny, textAlign: 'center' },
});
