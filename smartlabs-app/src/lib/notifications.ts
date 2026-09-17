import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Local + push notifications for study reminders and score alerts.
 *
 * - Daily reminder (19:00) to keep the streak alive.
 * - "Comeback" reminder re-armed on every app open — fires only if the user
 *   doesn't return within 2 days (an inactivity nudge).
 * - Immediate alert when an AI score finishes.
 * - Registers the device's Expo push token to users/{uid} so the backend can
 *   later broadcast pushes (e.g. new predictions / essays). Remote delivery on
 *   Android needs FCM credentials configured in EAS; token registration is
 *   best-effort and silently no-ops until then.
 *
 * All reminders respect the Settings "study reminders" toggle.
 */
const NOTIF_KEY = (uid: string) => `sl.notif.${uid}`;
const COMEBACK_ID = 'sl-comeback';
const DAILY_ID = 'sl-daily';

// Show a banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function remindersEnabled(uid?: string): Promise<boolean> {
  if (!uid) return true;
  try {
    const v = await AsyncStorage.getItem(NOTIF_KEY(uid));
    return v !== '0';
  } catch {
    return true;
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === 'granted';
}

async function androidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SmartLabs',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Call after sign-in: channel, permission, reminders, push-token registration. */
export async function initNotifications(uid?: string): Promise<void> {
  try {
    await androidChannel();
    if (await remindersEnabled(uid)) {
      if (await ensurePermission()) {
        await scheduleReminders(uid);
        await registerPushToken(uid);
      }
    } else {
      await cancelReminders();
    }
  } catch {
    /* best effort */
  }
}

export async function scheduleReminders(uid?: string): Promise<void> {
  if (!(await remindersEnabled(uid))) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: { title: 'Time for PTE practice 🎯', body: 'A few minutes today keeps your streak alive.' },
      trigger: { hour: 19, minute: 0, repeats: true },
    });
    await scheduleComeback(uid);
  } catch {
    /* ignore */
  }
}

/** Re-arm on every app open: fires only if the user doesn't return in 2 days. */
export async function scheduleComeback(uid?: string): Promise<void> {
  if (!(await remindersEnabled(uid))) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(COMEBACK_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: COMEBACK_ID,
      content: { title: 'We miss you! 🔥', body: "Don't lose your progress — jump back in for a quick practice." },
      trigger: { seconds: 2 * 24 * 60 * 60 },
    });
  } catch {
    /* ignore */
  }
}

export async function cancelReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
}

/** Immediate local alert when an AI score is ready. */
export async function notifyScoreDone(overall: number, label: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Your AI score is ready ✅', body: `${label}: ${Math.round(overall)} / 90` },
      trigger: null,
    });
  } catch {
    /* ignore */
  }
}

async function registerPushToken(uid?: string): Promise<void> {
  if (!uid || !Device.isDevice) return;
  try {
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await setDoc(
      doc(db, 'users', uid),
      { pushToken: token, pushPlatform: Platform.OS, pushTokenUpdatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    /* FCM not configured yet — ignore */
  }
}
