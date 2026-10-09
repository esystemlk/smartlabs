import type { Metadata } from 'next';
import { IeltsMockRunner } from '@/components/ielts/mock-runner';
import { getMock } from '@/lib/ielts-mock/mocks';
import { getCambridge21WritingTest } from '@/lib/ielts-writing/cambridge-21';
import listening from '@/lib/ielts-listening/cambridge-20-test-2.json';
import reading from '@/lib/ielts-reading/cambridge-17-test-1.json';

export const metadata: Metadata = { title: 'IELTS Mock Test 4 · Smart Labs' };

export default function Page() {
  const mock = getMock('mock-4')!;
  const w = getCambridge21WritingTest(mock.writingTestN)!;
  const writing = { task1: { prompt: w.task1.prompt, image: w.task1.image, imageAlt: w.task1.imageAlt, visualType: w.task1.visualType }, task2: { prompt: w.task2.prompt } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <IeltsMockRunner mock={mock} listening={listening as any} reading={reading as any} writing={writing} />;
}
