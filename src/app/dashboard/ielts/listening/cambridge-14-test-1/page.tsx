import type { Metadata } from 'next';
import { ListeningRunner, type ListeningTestData } from '@/components/ielts/listening-runner';
import data from '@/lib/ielts-listening/cambridge-14-test-1.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 14 · Listening Test 1' };
export default function Page() { return <ListeningRunner data={data as unknown as ListeningTestData} />; }
