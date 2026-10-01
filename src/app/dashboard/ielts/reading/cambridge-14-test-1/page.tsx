import type { Metadata } from 'next';
import { ReadingRunner, type TestData } from '@/components/ielts/reading-runner';
import data from '@/lib/ielts-reading/cambridge-14-test-1.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 14 · Academic Reading Test 1' };
export default function Page() { return <ReadingRunner data={data as unknown as TestData} />; }
