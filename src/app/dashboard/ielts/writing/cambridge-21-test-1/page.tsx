import type { Metadata } from 'next';
import { WritingRunner } from '@/components/ielts/writing-runner';
import { getCambridge21WritingTest } from '@/lib/ielts-writing/cambridge-21';
export const metadata: Metadata = { title: 'Cambridge IELTS 21 · Academic Writing Test 1' };
export default function Page() { return <WritingRunner test={getCambridge21WritingTest(1)!} />; }
