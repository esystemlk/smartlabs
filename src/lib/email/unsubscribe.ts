import 'server-only';
import crypto from 'node:crypto';

// Signed unsubscribe tokens so a link can only unsubscribe the user it was
// issued for (no unsubscribing someone else by guessing their uid).
const SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.GMAIL_PASS || 'smartlabs-unsub';

export function signUid(uid: string): string {
  return crypto.createHmac('sha256', SECRET).update(uid).digest('hex').slice(0, 24);
}

export function verifyUid(uid: string, sig: string): boolean {
  if (!uid || !sig) return false;
  const expected = signUid(uid);
  try {
    return sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}

export function unsubscribeUrl(uid: string, appUrl: string): string {
  return `${appUrl}/unsubscribe?uid=${encodeURIComponent(uid)}&sig=${signUid(uid)}`;
}
