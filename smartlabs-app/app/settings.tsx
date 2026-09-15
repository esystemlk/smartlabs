import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/auth/AuthContext';
import { useProfileMeta } from '@/lib/meta';
import { ScreenHeader } from '@/ui/brand';
import { useAppLayout } from '@/ui/layout';
import { C } from '@/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NOTIF_KEY = (uid: string) => `sl.notif.${uid}`;

export default function Settings() {
  const layout = useAppLayout();
  const { user, updateName, resetPassword } = useAuth();
  const meta = useProfileMeta();

  const [name, setName] = useState('');
  const [target, setTarget] = useState(79);
  const [exam, setExam] = useState<Date | null>(null);
  const [notif, setNotif] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  // Seed from the live profile once it loads.
  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user?.displayName]);
  useEffect(() => {
    if (!meta.loading) {
      setTarget(meta.targetScore);
      setExam(meta.examDate);
    }
  }, [meta.loading, meta.targetScore, meta.examDate]);
  useEffect(() => {
    if (user) AsyncStorage.getItem(NOTIF_KEY(user.uid)).then((v) => setNotif(v !== '0'));
  }, [user]);

  const saveName = async () => {
    if (name.trim().length < 2) return Alert.alert('Name too short', 'Please enter your full name.');
    setSavingName(true);
    try {
      await updateName(name);
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const saveGoal = async (nextTarget: number, nextExam: Date | null) => {
    if (!user) return;
    setSavingGoal(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { targetScore: nextTarget, examDate: nextExam ? nextExam.toISOString().slice(0, 10) : null },
        { merge: true },
      );
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingGoal(false);
    }
  };

  const changeTarget = (delta: number) => {
    const next = Math.max(10, Math.min(90, target + delta));
    setTarget(next);
    saveGoal(next, exam);
  };
  const setPreset = (v: number) => { setTarget(v); saveGoal(v, exam); };
  const onExam = (d: Date | null) => { setExam(d); saveGoal(target, d); };

  const changePassword = () => {
    if (!user?.email) return;
    Alert.alert('Change password', `We'll email a secure reset link to ${user.email}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send link',
        onPress: async () => {
          try {
            await resetPassword(user.email!);
            Alert.alert('Email sent', 'Check your inbox for the reset link.');
          } catch (e) {
            Alert.alert('Could not send', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const toggleNotif = async (v: boolean) => {
    setNotif(v);
    if (user) AsyncStorage.setItem(NOTIF_KEY(user.uid), v ? '1' : '0');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={[s.header, layout.content]}><ScreenHeader title="Settings" /></View>
      <ScrollView contentContainerStyle={[s.content, layout.content]} showsVerticalScrollIndicator={false}>
        {/* Goal */}
        <Text style={s.section}>Your goal</Text>
        <View style={s.card}>
          <Text style={s.rowLabel}>Target score</Text>
          <View style={s.stepper}>
            <Pressable onPress={() => changeTarget(-1)} style={s.stepBtn}><Ionicons name="remove" size={20} color={C.blue} /></Pressable>
            <Text style={s.stepValue}>{target}</Text>
            <Pressable onPress={() => changeTarget(1)} style={s.stepBtn}><Ionicons name="add" size={20} color={C.blue} /></Pressable>
          </View>
          <View style={s.presets}>
            {[65, 79, 90].map((v) => (
              <Pressable key={v} onPress={() => setPreset(v)} style={[s.preset, target === v && s.presetOn]}>
                <Text style={[s.presetText, target === v && s.presetTextOn]}>{v}</Text>
              </Pressable>
            ))}
            {savingGoal ? <ActivityIndicator color={C.blue} style={{ marginLeft: 6 }} /> : null}
          </View>

          <View style={s.divider} />
          <Text style={s.rowLabel}>Exam date</Text>
          <DateSelect value={exam} onChange={onExam} />
        </View>

        {/* Account */}
        <Text style={s.section}>Account</Text>
        <View style={s.card}>
          <Text style={s.rowLabel}>Display name</Text>
          <View style={s.nameRow}>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.faint} style={s.input} />
            <Pressable onPress={saveName} disabled={savingName} style={s.saveBtn}>
              {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
            </Pressable>
          </View>

          <View style={s.divider} />
          <Text style={s.rowLabel}>Email</Text>
          <Text style={s.readonly}>{user?.email}</Text>

          <View style={s.divider} />
          <Pressable onPress={changePassword} style={s.linkRow}>
            <View style={s.linkIcon}><Ionicons name="lock-closed-outline" size={18} color={C.slate} /></View>
            <Text style={s.linkLabel}>Change password</Text>
            <Ionicons name="chevron-forward" size={18} color={C.faint} />
          </Pressable>
        </View>

        {/* Preferences */}
        <Text style={s.section}>Preferences</Text>
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={s.linkIcon}><Ionicons name="notifications-outline" size={18} color={C.slate} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.linkLabel}>Study reminders</Text>
              <Text style={s.hint}>Daily nudges to keep your streak going.</Text>
            </View>
            <Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: C.blue }} />
          </View>
        </View>

        <Text style={s.footer}>Your target and exam date sync with your SmartLabs account.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Day / Month / Year selector — modal lists, no native dependency. */
function DateSelect({ value, onChange }: { value: Date | null; onChange: (d: Date | null) => void }) {
  const [open, setOpen] = useState<null | 'd' | 'm' | 'y'>(null);
  const now = new Date();
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() + i);
  const d = value?.getDate() ?? '';
  const m = value ? MONTHS[value.getMonth()] : '';
  const y = value?.getFullYear() ?? '';

  const set = (part: 'd' | 'm' | 'y', n: number) => {
    const base = value ?? new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nd = new Date(base);
    if (part === 'd') nd.setDate(n);
    if (part === 'm') nd.setMonth(n);
    if (part === 'y') nd.setFullYear(n);
    onChange(nd);
    setOpen(null);
  };

  const options = open === 'd'
    ? Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), val: i + 1 }))
    : open === 'm'
      ? MONTHS.map((mm, i) => ({ label: mm, val: i }))
      : years.map((yy) => ({ label: String(yy), val: yy }));

  return (
    <View>
      <View style={s.dateRow}>
        <Pressable style={s.datePill} onPress={() => setOpen('d')}><Text style={[s.datePillText, !d && s.datePlaceholder]}>{d || 'Day'}</Text></Pressable>
        <Pressable style={[s.datePill, { flex: 1.4 }]} onPress={() => setOpen('m')}><Text style={[s.datePillText, !m && s.datePlaceholder]}>{m || 'Month'}</Text></Pressable>
        <Pressable style={[s.datePill, { flex: 1.2 }]} onPress={() => setOpen('y')}><Text style={[s.datePillText, !y && s.datePlaceholder]}>{y || 'Year'}</Text></Pressable>
      </View>
      {value ? (
        <Pressable onPress={() => onChange(null)} style={{ marginTop: 8 }}><Text style={s.clearDate}>Clear date</Text></Pressable>
      ) : null}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={s.modalBg} onPress={() => setOpen(null)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{open === 'd' ? 'Day' : open === 'm' ? 'Month' : 'Year'}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((o) => (
                <Pressable key={o.label} style={s.modalOpt} onPress={() => open && set(open, o.val)}>
                  <Text style={s.modalOptText}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 4 },
  content: { padding: 20, paddingBottom: 32 },
  section: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: C.slateLight, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: C.navy },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  stepBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.tintBlue, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 30, fontWeight: '800', color: C.navy, minWidth: 56, textAlign: 'center' },
  presets: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  preset: { paddingHorizontal: 16, height: 34, borderRadius: 999, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  presetOn: { backgroundColor: C.blue, borderColor: C.blue },
  presetText: { fontSize: 13, fontWeight: '700', color: C.slate },
  presetTextOn: { color: '#fff' },

  dateRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  datePill: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.borderStrong, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  datePillText: { fontSize: 15, fontWeight: '700', color: C.navy },
  datePlaceholder: { color: C.faint, fontWeight: '600' },
  clearDate: { color: C.danger, fontSize: 13, fontWeight: '700' },

  nameRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: C.borderStrong, paddingHorizontal: 14, fontSize: 15, color: C.navy, backgroundColor: '#fff' },
  saveBtn: { paddingHorizontal: 20, height: 50, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  readonly: { fontSize: 15, color: C.slate, marginTop: 8 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: C.navy },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: { fontSize: 12, color: C.slateLight, marginTop: 2 },

  footer: { textAlign: 'center', color: C.faint, fontSize: 12, marginTop: 20, lineHeight: 18 },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modalCard: { width: '100%', maxWidth: 320, backgroundColor: '#fff', borderRadius: 18, padding: 10 },
  modalTitle: { fontSize: 13, fontWeight: '800', color: C.slateLight, padding: 10 },
  modalOpt: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10 },
  modalOptText: { fontSize: 16, color: C.navy, fontWeight: '600' },
});
