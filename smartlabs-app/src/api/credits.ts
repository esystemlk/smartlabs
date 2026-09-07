import { apiPost } from '@/api/client';

/** Credit pools that map to a `/api/<pool>-credits/create-payment` endpoint. */
export type CreditPool = 'sst' | 'swt' | 'speaking';

export interface PayHereParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

/**
 * Ask the backend to create a PayHere order and return the signed params. Feed
 * the returned `params` straight into the PayHere React Native SDK
 * (`PayHere.startPayment(params, onComplete, onError, onDismiss)`). The matching
 * `/api/payhere/<pool>-notify` webhook credits the shared account on success.
 */
export function createCreditPayment(pool: CreditPool, packageId: string) {
  return apiPost<{ success: boolean; params: PayHereParams; orderId: string }>(
    `/api/${pool}-credits/create-payment`,
    { packageId },
  );
}
