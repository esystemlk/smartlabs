import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IELTS Course Registration | Smart Labs',
  description: 'Register and pay online for the Smart Labs IELTS course — LKR 20,000, 1-month program. Batch details shared by email and WhatsApp after registration.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
