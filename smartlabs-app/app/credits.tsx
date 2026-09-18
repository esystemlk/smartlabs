import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { buyCredits } from '@/payments/payhere';
import { ScreenHeader } from '@/ui/brand';
import { useAppLayout } from '@/ui/layout';
import { PAYHERE_SANDBOX } from '@/config';
import { C } from '@/theme';

interface Pkg { id: string; label: string; price: number; priceUSD: number; scoring: number; best?: boolean }
type Currency = 'LKR' | 'USD';

// One universal pool — these credits work on EVERY AI-scored part (Essay, SWT,
// SST, all Speaking tasks, IELTS essay). One credit = one AI scoring.
const UNIVERSAL_PACKAGES: Pkg[] = [
  { id: 'universal_10', label: '10 AI Credits', price: 1500, priceUSD: 5, scoring: 10 },
  { id: 'universal_40', label: '40 AI Credits', price: 3500, priceUSD: 12, scoring: 40, best: true },
  { id: 'universal_100', label: '100 AI Credits', price: 6000, priceUSD: 20, scoring: 100 },
  { id: 'universal_unlimited', label: 'Unlimited · 40 days', price: 15000, priceUSD: 50, scoring: -1 },
];
const fmtPrice = (pkg: Pkg, c: Currency) => (c === 'USD' ? `$${pkg.priceUSD}` : `Rs ${pkg.price.toLocaleString()}`);

const AI_PARTS = ['Write Essay', 'Summarize Written Text', 'Summarize Spoken Text', 'All Speaking tasks', 'IELTS Essay'];

export default function Credits() {
  const layout = useAppLayout();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [busy, setBusy] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('LKR');

  const onBuy = async (pkg: Pkg) => {
    setBusy(pkg.id);
    try {
      const res = await buyCredits('universal', pkg.id, { sandbox: PAYHERE_SANDBOX, currency });
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
            <Text style={s.balanceLabel}>Universal AI credits</Text>
            <Text style={s.balanceSub}>One credit = one AI scoring · shared with your smartlabs.lk account</Text>
          </View>
        </View>

        {/* What the credits work on */}
        <View style={s.worksOn}>
          <Text style={s.worksOnTitle}>Works on every AI-scored part</Text>
          <View style={s.worksOnList}>
            {AI_PARTS.map((p) => (
              <View key={p} style={s.worksOnRow}>
                <Ionicons name="checkmark-circle" size={16} color={C.success} />
                <Text style={s.worksOnText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Currency toggle */}
        <View style={s.currencyRow}>
          <Text style={s.currencyLabel}>PAY IN</Text>
          <View style={s.currencyToggle}>
            {(['LKR', 'USD'] as Currency[]).map((c) => (
              <Pressable key={c} onPress={() => setCurrency(c)} style={[s.currencyBtn, currency === c && s.currencyBtnActive]}>
                <Text style={[s.currencyBtnText, currency === c && s.currencyBtnTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          {UNIVERSAL_PACKAGES.map((pkg) => (
            <Pressable key={pkg.id} onPress={() => onBuy(pkg)} disabled={!!busy}
              style={({ pressed }) => [s.pkg, pkg.best && { borderColor: C.blue }, pressed && { opacity: 0.9 }]}>
              <View style={{ flex: 1 }}>
                <View style={s.pkgTop}>
                  <Text style={s.pkgLabel}>{pkg.label}</Text>
                  {pkg.best ? <View style={[s.badge, { backgroundColor: C.blue }]}><Text style={s.badgeText}>POPULAR</Text></View> : null}
                </View>
                <Text style={s.pkgSub}>{pkg.scoring === -1 ? 'Unlimited AI scorings for 40 days' : `${pkg.scoring} AI scorings`}</Text>
              </View>
              {busy === pkg.id
                ? <ActivityIndicator color={C.blue} />
                : <Text style={[s.pkgPrice, { color: C.blue }]}>{fmtPrice(pkg, currency)}</Text>}
            </Pressable>
          ))}
        </View>

        <Text style={s.legacyNote}>Any part-specific credits you already own are used first, then your universal credits.</Text>

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
  worksOn: { backgroundColor: C.tintBlue, borderRadius: 16, padding: 16, marginTop: 14 },
  worksOnTitle: { fontSize: 13, fontWeight: '800', color: C.blue, marginBottom: 10 },
  worksOnList: { gap: 8 },
  worksOnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  worksOnText: { fontSize: 14, color: C.navy, fontWeight: '600' },
  legacyNote: { fontSize: 12, color: C.slateLight, textAlign: 'center', lineHeight: 17, marginTop: 16 },
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
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  currencyLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.slateLight },
  currencyToggle: { flexDirection: 'row', backgroundColor: '#EEF1F8', borderRadius: 12, padding: 3 },
  currencyBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 9 },
  currencyBtnActive: { backgroundColor: C.blue },
  currencyBtnText: { fontSize: 13, fontWeight: '800', color: C.slate },
  currencyBtnTextActive: { color: '#fff' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 24 },
  secureText: { fontSize: 12, color: C.slateLight },
});
