import { createHash } from 'crypto';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

/**
 * PayHere issues a separate Merchant Secret per approved domain/app. The website
 * uses `PAYHERE_MERCHANT_SECRET`; the mobile app (package `lk.smartlabs.app`)
 * has its own approved app entry, so requests from the app must be hashed — and
 * their notifications verified — with the app's secret.
 *
 * The app sends `{ client: 'app' }` in the create-payment body. If the app-side
 * env vars aren't set, everything falls back to the website credentials, so the
 * web checkout is unaffected.
 */
export function payhereCreds(client?: string): { merchantId?: string; merchantSecret?: string } {
  const useApp = client === 'app';
  const merchantId =
    (useApp && process.env.PAYHERE_APP_MERCHANT_ID) || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const merchantSecret =
    (useApp && process.env.PAYHERE_APP_MERCHANT_SECRET) || process.env.PAYHERE_MERCHANT_SECRET;
  return { merchantId, merchantSecret };
}

/**
 * Verify a PayHere `notify` md5sig against BOTH the website and app secrets, so
 * payments started from either source validate. Returns false if neither matches.
 */
export function verifyPayhereSig(p: {
  merchant_id: unknown;
  order_id: unknown;
  payhere_amount: unknown;
  payhere_currency: unknown;
  status_code: unknown;
  md5sig: unknown;
}): boolean {
  const secrets = [process.env.PAYHERE_MERCHANT_SECRET, process.env.PAYHERE_APP_MERCHANT_SECRET].filter(
    (s): s is string => !!s,
  );
  const want = String(p.md5sig).toUpperCase();
  const base =
    String(p.merchant_id) + String(p.order_id) + String(p.payhere_amount) +
    String(p.payhere_currency) + String(p.status_code);
  return secrets.some((sec) => md5(base + md5(sec)) === want);
}
