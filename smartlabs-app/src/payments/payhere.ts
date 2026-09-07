import { createCreditPayment, type CreditPool, type PayHereParams } from '@/api/credits';

/**
 * Launches PayHere checkout for a credit package. The native SDK
 * (`@payhere/payhere-mobilesdk-reactnative`) is loaded lazily so the app still
 * runs in Expo Go (where native modules are unavailable) — real checkout needs
 * an Expo dev build / production build with the SDK installed.
 *
 * On success PayHere calls the server notify webhook, which credits the shared
 * Firestore account; the CreditsContext listener then reflects the new balance.
 */
export type PayResult = { status: 'completed' | 'dismissed' | 'unavailable'; message?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadSdk(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@payhere/payhere-mobilesdk-reactnative').default;
  } catch {
    return null;
  }
}

/** Shape the create-payment params into what the PayHere RN SDK expects. */
function toSdkPayment(p: PayHereParams, sandbox: boolean) {
  return {
    sandbox,
    merchant_id: p.merchant_id,
    notify_url: p.notify_url,
    order_id: p.order_id,
    items: p.items,
    amount: p.amount,
    currency: p.currency,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    phone: p.phone,
    address: p.address,
    city: p.city,
    country: p.country,
    hash: p.hash,
  };
}

export async function buyCredits(
  pool: CreditPool,
  packageId: string,
  opts: { sandbox?: boolean } = {},
): Promise<PayResult> {
  const { params } = await createCreditPayment(pool, packageId);
  const PayHere = loadSdk();
  if (!PayHere) {
    return {
      status: 'unavailable',
      message: 'Native checkout needs an Expo dev build with the PayHere SDK. Order was created on the server.',
    };
  }
  return new Promise<PayResult>((resolve) => {
    PayHere.startPayment(
      toSdkPayment(params, opts.sandbox ?? false),
      () => resolve({ status: 'completed' }),
      (err: string) => resolve({ status: 'dismissed', message: err }),
      () => resolve({ status: 'dismissed' }),
    );
  });
}
