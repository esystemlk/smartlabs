import { useAppLayout } from '@/ui/layout';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthContext';
import { useCredits } from '@/credits/CreditsContext';
import { useProfileMeta, totalPaidCredits } from '@/lib/meta';
import { C } from '@/theme';

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string; route?: string; url?: string }[] = [
  { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  { icon: 'mic-outline', label: 'My practice space', route: '/(tabs)/practice' },
  { icon: 'bar-chart-outline', label: 'My progress', route: '/(tabs)/progress' },
  { icon: 'document-text-outline', label: 'Explore mock tests', route: '/mock' },
  { icon: 'help-buoy-outline', label: 'Help & Support', url: 'https://www.smartlabs.lk/contact' },
];

/** Screen 12 — Profile. */
export default function Account() {
  const layout = useAppLayout();
  const { user, signOut } = useAuth();
  const credits = useCredits();
  const meta = useProfileMeta();
  const router = useRouter();

  const name = user?.displayName ?? 'Student';
  const initial = name.charAt(0).toUpperCase();
  const paid = totalPaidCredits(credits);
  const creditLabel = credits.unlimited ? 'Unlimited' : `${paid.toLocaleString()} Credits`;
  const examLabel = meta.examDate
    ? meta.examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not set';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={s.titleRow}>
          <Text style={s.title}>Profile</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={s.gear} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={C.slate} />
          </Pressable>
        </View>

        {/* Identity */}
        <View style={s.idCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stat cards — tap to edit in Settings */}
        <View style={[s.statRow, layout.compact && { flexDirection: 'column' }]}>
          <Pressable style={s.statCard} onPress={() => router.push('/settings')}>
            <View style={s.statIcon}><Ionicons name="flag" size={16} color={C.blue} /></View>
            <Text style={s.statLabel}>PTE Target</Text>
            <Text style={s.statValue}>{meta.targetScore}</Text>
          </Pressable>
          <Pressable style={s.statCard} onPress={() => router.push('/settings')}>
            <View style={[s.statIcon, { backgroundColor: C.writingBg }]}><Ionicons name="calendar" size={16} color={C.writing} /></View>
            <Text style={s.statLabel}>Exam Date</Text>
            <Text style={[s.statValue, { fontSize: 15 }]}>{examLabel}</Text>
          </Pressable>
        </View>

        {/* AI Credits */}
        <Pressable style={[s.creditRow, layout.compact && { flexWrap: 'wrap' }]} onPress={() => !credits.unlimited && router.push('/credits')}>
          <View style={s.creditIcon}><Ionicons name="flash" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.creditLabel}>AI Credits</Text>
            <Text style={s.creditValue}>{creditLabel}</Text>
          </View>
          {!credits.unlimited ? (
            <View style={s.manage}><Text style={s.manageText}>Manage</Text></View>
          ) : null}
        </Pressable>

        {/* Menu */}
        <View style={s.menu}>
          {MENU.map((m, i) => (
            <Pressable
              accessibilityRole="button"
              key={m.label}
              style={[s.menuRow, i < MENU.length - 1 && s.menuBorder]}
              onPress={() => (m.url ? Linking.openURL(m.url) : m.route ? router.push(m.route as never) : undefined)}
            >
              <View style={s.menuIcon}><Ionicons name={m.icon} size={19} color={C.slate} /></View>
              <Text style={s.menuLabel}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable accessibilityRole="button" style={s.signOut} onPress={signOut}>
          <Ionicons name="log-out-outline" size={19} color={C.danger} />
          <Text style={s.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={s.version}>SmartLabs PTE · same account as smartlabs.lk</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: C.navy },
  gear: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  idCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#EDEBFF', borderRadius: 24, borderWidth: 1, borderColor: '#E3DFFE', padding: 20, marginTop: 18 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: C.navy },
  email: { fontSize: 13, color: C.slateLight, marginTop: 2 },

  statRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  statIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.tintBlue, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600', marginTop: 10 },
  statValue: { fontSize: 20, color: C.navy, fontWeight: '800', marginTop: 2 },

  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 14 },
  creditIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  creditLabel: { fontSize: 12, color: C.slateLight, fontWeight: '600' },
  creditValue: { fontSize: 18, color: C.navy, fontWeight: '800' },
  manage: { backgroundColor: C.tintBlue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  manageText: { color: C.blue, fontSize: 13, fontWeight: '800' },

  menu: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, marginTop: 14, paddingHorizontal: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: C.navy, fontWeight: '600' },

  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.dangerBg, borderRadius: 14, paddingVertical: 15, marginTop: 18 },
  signOutText: { color: C.danger, fontSize: 15, fontWeight: '800' },
  version: { textAlign: 'center', color: C.faint, fontSize: 12, marginTop: 18 },
});
