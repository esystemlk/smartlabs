import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Download Smart Labs for Windows",
  description: "Download the Smart Labs desktop app for Windows and practise PTE and IELTS with a fast, distraction-free experience.",
  alternates: { canonical: '/download/windows' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
