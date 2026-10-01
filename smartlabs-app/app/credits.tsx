import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/ui/brand';
import { useAppLayout } from '@/ui/layout';
import { useCredits } from '@/credits/CreditsContext';
import { totalPaidCredits } from '@/lib/meta';
import { C } from '@/theme';

const AI_PARTS = ['Write Essay', 'Summarize Written Text', 'Summarize Spoken Text', 'All Speaking tasks', 'IELTS Essay'];

/**
 * Credits are purchased on the website (smartlabs.lk) and sync to the app.
 * The app never runs an in-app checkout — this keeps it compliant with Google
 * Play's payments policy for digital goods.
 */
export default function Credits() {
  const layout = useAppLayout();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const credits = useCredits();

  const unlimited = credits.unlimited || credits.universalMonthly;
  const total = totalPaidCredits(credits);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={[s.header, layout.content]}>
        <ScreenHeader title="AI Credits" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        {reason ? (
          <View style={s.notice}>
            <Ionicons name="information-circle" size={20} color={C.amber} />
            <Text style={s.noticeText}>{reason}</Text>
          </View>
        ) : null}

        {/* Balance */}
        <View style={s.balance}>
          <View style={s.balanceIcon}><Ionicons name="flash" size={20} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.balanceLabel}>Your AI credits</Text>
            <Text style={s.balanceSub}>One credit = one AI scoring · works on every AI part</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {unlimited
              ? <View style={s.unlimitedPill}><Ionicons name="infinite" size={16} color={C.blue} /><Text style={s.unlimitedText}>Unlimited</Text></View>
              : <><Text style={s.balanceValue}>{credits.loading ? '—' : total}</Text><Text style={s.balanceUnit}>credits</Text></>}
          </View>
        </View>

        {/* Works on */}
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

        {/* Informational only — no in-app or outbound checkout (Play policy safe). */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={C.slateLight} />
          <Text style={s.infoText}>
            Credits are managed on your SmartLabs account and sync here automatically. Any
            part-specific credits you already own are used first, then your universal credits.
          </Text>
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
  balanceValue: { fontSize: 24, fontWeight: '800', color: C.navy },
  balanceUnit: { fontSize: 11, color: C.slateLight, fontWeight: '600' },
  unlimitedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.tintBlue, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  unlimitedText: { fontSize: 13, fontWeight: '800', color: C.blue },
  worksOn: { backgroundColor: C.tintBlue, borderRadius: 16, padding: 16, marginTop: 14 },
  worksOnTitle: { fontSize: 13, fontWeight: '800', color: C.blue, marginBottom: 10 },
  worksOnList: { gap: 8 },
  worksOnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  worksOnText: { fontSize: 14, color: C.navy, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 20 },
  infoText: { flex: 1, fontSize: 13, color: C.slateLight, lineHeight: 19, fontWeight: '600' },
});
