import type { Metadata } from 'next';
import { ReadingRunner, type TestData } from '@/components/ielts/reading-runner';
import data from '@/lib/ielts-reading/cambridge-18-test-3.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 18 · Academic Reading Test 3' };
export default function Page() { return <ReadingRunner data={data as unknown as TestData} />; }
