import type { Metadata } from 'next';
import { ReadingRunner, type TestData } from '@/components/ielts/reading-runner';
import data from '@/lib/ielts-reading/cambridge-16-test-4.json';
export const metadata: Metadata = { title: 'Cambridge IELTS 16 · Academic Reading Test 4' };
export default function Page() { return <ReadingRunner data={data as unknown as TestData} />; }
