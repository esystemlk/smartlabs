import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CreditPool } from '@/api/credits';
import { buyCredits } from '@/payments/payhere';
import { ScreenHeader } from '@/ui/brand';
import { useAppLayout } from '@/ui/layout';
import { PAYHERE_SANDBOX } from '@/config';
import { C } from '@/theme';

interface Pkg { id: string; label: string; price: number; scoring: number; best?: boolean }

const POOLS: { pool: CreditPool; title: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string; packages: Pkg[] }[] = [
  {
    pool: 'speaking', title: 'Speaking', icon: 'mic', fg: C.speaking, bg: C.speakingBg,
    packages: [
      { id: 'speaking_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'speaking_40', label: '40 Scorings', price: 3500, scoring: 40, best: true },
      { id: 'speaking_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'speaking_unlimited', label: 'Unlimited · 40 days', price: 15000, scoring: -1 },
    ],
  },
  {
    pool: 'sst', title: 'Summarize Spoken Text', icon: 'headset', fg: C.listening, bg: C.listeningBg,
    packages: [
      { id: 'sst_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'sst_40', label: '40 Scorings', price: 3500, scoring: 40, best: true },
      { id: 'sst_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'sst_unlimited', label: 'Unlimited · 40 days', price: 15000, scoring: -1 },
    ],
  },
  {
    pool: 'swt', title: 'Summarize Written Text', icon: 'pencil', fg: C.writing, bg: C.writingBg,
    packages: [
      { id: 'swt_10', label: '10 Scorings', price: 1500, scoring: 10 },
      { id: 'swt_40', label: '40 Scorings', price: 3500, scoring: 40, best: true },
      { id: 'swt_100', label: '100 Scorings', price: 6000, scoring: 100 },
      { id: 'swt_unlimited', label: 'Unlimited · 40 days', price: 15000, scoring: -1 },
    ],
  },
];

export default function Credits() {
  const layout = useAppLayout();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [busy, setBusy] = useState<string | null>(null);

  const onBuy = async (pool: CreditPool, pkg: Pkg) => {
    setBusy(pkg.id);
    try {
      const res = await buyCredits(pool, pkg.id, { sandbox: PAYHERE_SANDBOX });
      if (res.status === 'completed') {
        Alert.alert('Payment complete', 'Your credits will appear here as soon as the payment is confirmed.', [
          { text: 'Great', onPress: () => router.back() },
        ]);
      } else if (res.status === 'unavailable') {
        Alert.alert('Checkout unavailable', res.message ?? 'Please try again from the installed app.');
      } else if (res.status === 'dismissed' && res.message) {
        Alert.alert('Payment not completed', res.message);
      }
    } catch (e) {
      Alert.alert('Could not start payment', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={[s.header, layout.content]}>
        <ScreenHeader title="Top up credits" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        {reason ? (
          <View style={s.notice}>
            <Ionicons name="information-circle" size={20} color={C.amber} />
            <Text style={s.noticeText}>{reason}</Text>
          </View>
        ) : null}

        <View style={s.balance}>
          <View style={s.balanceIcon}><Ionicons name="flash" size={20} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.balanceLabel}>AI scoring credits</Text>
            <Text style={s.balanceSub}>Shared with your smartlabs.lk account · prices in LKR</Text>
          </View>
        </View>

        {POOLS.map((group) => (
          <View key={group.pool} style={{ marginTop: 22 }}>
            <View style={s.groupHead}>
              <View style={[s.groupIcon, { backgroundColor: group.bg }]}><Ionicons name={group.icon} size={18} color={group.fg} /></View>
              <Text style={s.groupTitle}>{group.title}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {group.packages.map((pkg) => (
                <Pressable key={pkg.id} onPress={() => onBuy(group.pool, pkg)} disabled={!!busy}
                  style={({ pressed }) => [s.pkg, pkg.best && { borderColor: group.fg }, pressed && { opacity: 0.9 }]}>
                  <View style={{ flex: 1 }}>
                    <View style={s.pkgTop}>
                      <Text style={s.pkgLabel}>{pkg.label}</Text>
                      {pkg.best ? <View style={[s.badge, { backgroundColor: group.fg }]}><Text style={s.badgeText}>POPULAR</Text></View> : null}
                    </View>
                    <Text style={s.pkgSub}>{pkg.scoring === -1 ? 'Unlimited AI scorings' : `${pkg.scoring} AI scorings`}</Text>
                  </View>
                  {busy === pkg.id
                    ? <ActivityIndicator color={group.fg} />
                    : <Text style={[s.pkgPrice, { color: group.fg }]}>Rs {pkg.price.toLocaleString()}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={s.secure}>
          <Ionicons name="shield-checkmark" size={15} color={C.success} />
          <Text style={s.secureText}>Secure checkout via PayHere{PAYHERE_SANDBOX ? ' (sandbox / test mode)' : ''}.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 4 },
  content: { padding: 20, paddingBottom: 32 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF7E6', borderRadius: 14, borderWidth: 1, borderColor: '#FCE3AE', padding: 14, marginBottom: 16 },
  noticeText: { flex: 1, fontSize: 13.5, color: '#7A5B12', lineHeight: 19, fontWeight: '600' },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  balanceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 15, fontWeight: '800', color: C.navy },
  balanceSub: { fontSize: 12, color: C.slateLight, marginTop: 2, lineHeight: 16 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  groupIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontSize: 17, fontWeight: '800', color: C.navy },
  pkg: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: C.border, padding: 16 },
  pkgTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pkgLabel: { fontSize: 16, fontWeight: '800', color: C.navy },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  pkgSub: { fontSize: 13, color: C.slateLight, marginTop: 3 },
  pkgPrice: { fontSize: 17, fontWeight: '800' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 24 },
  secureText: { fontSize: 12, color: C.slateLight },
});
