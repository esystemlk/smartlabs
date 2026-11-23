import '@/components/pte/task-workspace.css';
import { brandFontClass } from '@/lib/brand-fonts';
export default function PteTaskLayout({children}:{children:React.ReactNode}){
  return <div className={`pte-task-studio ${brandFontClass}`}><div className="pte-task-orientation"><span>PTE PRACTICE STUDIO</span><p>Choose a question. Complete your response. Learn from your feedback.</p></div>{children}</div>;
}
