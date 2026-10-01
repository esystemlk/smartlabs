import type { Metadata } from 'next';
import './studio.css';
export const metadata: Metadata = { title: 'IELTS Studio', description: 'Your dedicated SmartLabs IELTS study space.', robots: { index: false, follow: false } };
export default function IeltsLayout({ children }: { children: React.ReactNode }) { return <div className="ielts-studio">{children}</div>; }
