import type { Metadata } from 'next';
import { ReadingTest } from '@/components/ielts/reading-test';
export const metadata: Metadata = { title: 'Cambridge IELTS 11 · Academic Reading Test 1' };
export default function Page() { return <ReadingTest />; }
