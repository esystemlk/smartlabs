import type { Metadata } from 'next';
import { WebsiteGuide } from '@/components/guide/website-guide';
export const metadata: Metadata = { title: 'Website guide | SmartLabs Student Space' };
export default function GuidePage(){return <WebsiteGuide/>}
