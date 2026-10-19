import {Children,Fragment,type ReactNode} from 'react';
import './ielts-text.css';
/** Brand only the IELTS name, preserving surrounding wording and link semantics. */
export function IeltsText({children}:{children:ReactNode}){
  return <span className="ielts-brand-label">{Children.map(children,child=>typeof child==='string'?child.split(/(IELTS)/g).map((part,index)=>part==='IELTS'?<span className="ielts-brand-text" key={index}>IELTS</span>:<Fragment key={index}>{part}</Fragment>):child)}</span>;
}
