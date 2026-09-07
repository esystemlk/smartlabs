import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { useCredits, type PoolStatus } from '@/credits/CreditsContext';
import { Button, Card } from '@/ui/components';
import { theme } from '@/theme';

export default function Home() {
  const { user } = useAuth();
  const credits = useCredits();
  const router = useRouter();
  const firstName = (user?.displayName ?? 'there').split(' ')[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.hi}>Hi {firstName} 👋</Text>
      <Text style={styles.sub}>Ready to practise? Pick a task or check your credits below.</Text>

      <Card style={{ gap: 14 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Your credits</Text>
          {credits.unlimited ? (
            <Text style={[styles.badge, { color: theme.colors.success }]}>Unlimited ({credits.role})</Text>
          ) : null}
        </View>
        <View style={styles.creditGrid}>
          <CreditStat label="Speaking" pool={credits.speaking} unlimited={credits.unlimited} />
          <CreditStat label="SST" pool={credits.sst} unlimited={credits.unlimited} />
          <CreditStat label="SWT" pool={credits.swt} unlimited={credits.unlimited} />
          <CreditStat label="Essay" pool={credits.essay} unlimited={credits.unlimited} />
        </View>
        {!credits.unlimited ? <Button label="Buy credits" variant="ghost" onPress={() => router.push('/credits')} /> : null}
      </Card>

      <Button label="Start practising" onPress={() => router.push('/(tabs)/practice')} />
    </ScrollView>
  );
}

function CreditStat({ label, pool, unlimited }: { label: string; pool: PoolStatus; unlimited: boolean }) {
  const value = unlimited || pool.monthlyActive ? '∞' : pool.paid > 0 ? String(pool.paid) : `${Math.max(0, pool.freeLimit - pool.freeUsed)} free`;
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  hi: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' },
  sub: { color: theme.colors.textMuted, fontSize: theme.font.body, marginTop: -8 },
  cardTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  badge: { fontSize: theme.font.small, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: '22%',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { color: theme.colors.accent, fontSize: 20, fontWeight: '800' },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.font.tiny, marginTop: 2 },
});
