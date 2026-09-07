import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CreditPool } from '@/api/credits';
import { buyCredits } from '@/payments/payhere';
import { Card } from '@/ui/components';
import { theme } from '@/theme';

interface Pkg { id: string; label: string; price: number; scoring: number }

const POOLS: { pool: CreditPool; title: string; packages: Pkg[] }[] = [
  {
    pool: 'speaking',
    title: 'Speaking',
    packages: [
      { id: 'speaking_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'speaking_40', label: '40 Scorings', price: 3500, scoring: 40 },
      { id: 'speaking_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'speaking_unlimited', label: 'Unlimited (40 days)', price: 15000, scoring: -1 },
    ],
  },
  {
    pool: 'sst',
    title: 'Summarize Spoken Text',
    packages: [
      { id: 'sst_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'sst_40', label: '40 Scorings', price: 3500, scoring: 40 },
      { id: 'sst_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'sst_unlimited', label: 'Unlimited (40 days)', price: 15000, scoring: -1 },
    ],
  },
  {
    pool: 'swt',
    title: 'Summarize Written Text',
    packages: [
      { id: 'swt_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'swt_40', label: '40 Scorings', price: 3500, scoring: 40 },
      { id: 'swt_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'swt_unlimited', label: 'Unlimited (40 days)', price: 15000, scoring: -1 },
    ],
  },
];

export default function Credits() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const onBuy = async (pool: CreditPool, pkg: Pkg) => {
    setBusy(pkg.id);
    try {
      const res = await buyCredits(pool, pkg.id, { sandbox: true });
      if (res.status === 'completed') {
        Alert.alert('Payment complete', 'Your credits will appear once confirmed.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else if (res.status === 'unavailable') {
        Alert.alert('Checkout unavailable in Expo Go', res.message ?? 'Use a dev build to complete payment.');
      }
    } catch (e) {
      Alert.alert('Could not start payment', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Credits are shared with your web account. Prices in LKR.</Text>
      {POOLS.map((group) => (
        <View key={group.pool} style={{ gap: 10 }}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.packages.map((pkg) => (
            <Pressable key={pkg.id} onPress={() => onBuy(group.pool, pkg)} disabled={!!busy}>
              <Card style={styles.pkgRow}>
                <View>
                  <Text style={styles.pkgLabel}>{pkg.label}</Text>
                  <Text style={styles.pkgSub}>{pkg.scoring === -1 ? 'Unlimited scoring' : `${pkg.scoring} AI scorings`}</Text>
                </View>
                <Text style={styles.pkgPrice}>{busy === pkg.id ? '…' : `Rs ${pkg.price.toLocaleString()}`}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 22 },
  intro: { color: theme.colors.textMuted, fontSize: theme.font.small },
  groupTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgLabel: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' },
  pkgSub: { color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 },
  pkgPrice: { color: theme.colors.accent, fontSize: theme.font.h3, fontWeight: '800' },
});
