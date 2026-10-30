import Link from 'next/link';
import { IeltsText } from '@/components/ielts/ielts-text';
import { PlayCircle, ArrowRight } from 'lucide-react';
export function RecordedLearningEntry({exam}:{exam?:'pte'|'ielts'}){
  return <section className="student-help-strip"><PlayCircle size={27}/><div><h2><IeltsText>{exam?exam.toUpperCase()+' recorded courses':'Learn with recorded courses'}</IeltsText></h2><p>Explore video lessons, shared grammar sessions and study documents. Return to purchased courses in your learning library.</p></div><Link className="student-button student-button-secondary" href={'/dashboard/recorded-sessions'+(exam?'?exam='+exam:'')}>Explore recorded learning<ArrowRight size={16}/></Link></section>;
}
