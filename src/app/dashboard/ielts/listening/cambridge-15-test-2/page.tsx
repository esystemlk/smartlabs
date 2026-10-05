import type { Metadata } from 'next';
import { ListeningRunner, type ListeningTestData } from '@/components/ielts/listening-runner';
import data from '@/lib/ielts-listening/cambridge-15-test-2.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 15 · Listening Test 2' };
export default function Page() { return <ListeningRunner data={data as unknown as ListeningTestData} />; }
