import Link from 'next/link';
import { SpeakingRecordingLibrary } from '@/components/pte/speaking-recording-library';
export default function Page() {
  return <div className="student-page"><div className="student-page-heading"><span className="student-eyebrow">YOUR SPEAKING JOURNEY</span><h1>My speaking recordings</h1><p>Listen again, review your AI feedback and hear how your speaking improves. Only your account can access these saved answers.</p><Link href="/dashboard/results" className="student-text-link">← All practice results</Link></div><SpeakingRecordingLibrary /></div>;
}
