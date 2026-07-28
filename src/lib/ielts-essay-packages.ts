// IELTS essay credit packages — client-safe (no firebase-admin import), so it
// can be imported by both the trainer page and the payment/webhook routes.
//
// IELTS essay scoring has no "generation" credit (the examiner never rewrites
// the essay), so packages carry scoring credits only. Pricing mirrors the PTE
// essay packs.

export interface IeltsEssayPackage {
  id: string;
  /** Scoring credits granted. -1 = unlimited for the monthly window. */
  scoring: number;
  price: number;          // LKR
  label: string;
  /** Unlimited plans grant a time-boxed subscription instead of a credit count. */
  monthlyDays?: number;
  popular?: boolean;
}

export const IELTS_ESSAY_PACKAGES: IeltsEssayPackage[] = [
  { id: 'ielts_essay_10', scoring: 10, price: 1500, label: '10 Essays' },
  { id: 'ielts_essay_40', scoring: 40, price: 3500, label: '40 Essays', popular: true },
  { id: 'ielts_essay_100', scoring: 100, price: 6000, label: '100 Essays' },
  { id: 'ielts_essay_unlimited', scoring: -1, price: 15000, label: 'Unlimited', monthlyDays: 40 },
];

export const IELTS_ESSAY_ORDER_TYPE = 'ielts_essay_credits' as const;
