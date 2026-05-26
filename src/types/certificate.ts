export type CertType = 'digital' | 'printed';
export type CertStatus = 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
export type IdentityType = 'nic' | 'passport';
export type PaymentStatus = 'pending' | 'paid';

export interface CertificateRequest {
  id?: string;
  userId: string;
  email: string;
  nameOnCertificate: string;
  type: CertType;
  status: CertStatus;
  identityType: IdentityType;
  identityFrontUrl: string;
  identityBackUrl?: string;
  country: string;
  shippingAddress?: string;
  paymentOrderId?: string;
  paymentStatus: PaymentStatus;
  amount: number;
  adminNotes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt?: any;
}

export const CERT_PRICES: Record<CertType, number> = {
  digital: 1500,
  printed: 3500,
};
