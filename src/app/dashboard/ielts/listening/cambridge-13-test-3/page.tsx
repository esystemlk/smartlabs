import type { Metadata } from 'next';
import { ListeningRunner, type ListeningTestData } from '@/components/ielts/listening-runner';
import data from '@/lib/ielts-listening/cambridge-13-test-3.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 13 · Listening Test 3' };
export default function Page() { return <ListeningRunner data={data as unknown as ListeningTestData} />; }
