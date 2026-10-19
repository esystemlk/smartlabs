'use client';
import {IeltsText} from '@/components/ielts/ielts-text';

import Link from 'next/link';
import { Home, Mic, BookOpen, ReceiptText, BarChart3, Ellipsis, HelpCircle, Settings, Globe, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { examContext } from '@/lib/student-navigation';
import { useEffect, useState } from 'react';

const destinations = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'PTE', href: '/dashboard/pte', icon: Mic },
  { label: 'IELTS', href: '/dashboard/ielts', icon: BookOpen },
  { label: 'Registrations', href: '/dashboard/registrations', icon: ReceiptText },
  { label: 'Results', href: '/dashboard/results', icon: BarChart3 },
];

export function StudentMoreMenu({ pathname, onSignOut, includeNavigation = false }: { pathname: string; onSignOut: () => void; includeNavigation?: boolean }) {
  const [open, setOpen] = useState(false);
  const context = examContext(pathname);
  useEffect(() => setOpen(false), [pathname]);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button type="button" className="student-dock-item" aria-label="More student options" aria-current={/^\/dashboard\/(support|settings|guide)(\/|$)/.test(pathname) ? 'page' : undefined}><Ellipsis size={22} /><span>More</span></button></PopoverTrigger>
    <PopoverContent side="top" align="end" sideOffset={16} className="student-dock-menu" aria-label="Student options">
      {includeNavigation && <nav aria-label="Exam navigation">{destinations.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}><item.icon size={18} /><IeltsText>{item.label}</IeltsText></Link>)}</nav>}
      {context && <nav aria-label={`${context.exam.toUpperCase()} skills`}><p>{context.exam === 'pte' ? 'PTE Academic' : 'IELTS'} skills</p>{['speaking','writing','reading','listening'].map(skill => <Link href={`/dashboard/${context.exam}/${skill}`} key={skill} onClick={() => setOpen(false)}>{skill.charAt(0).toUpperCase()+skill.slice(1)}</Link>)}{context.exam === 'ielts' && <Link href="/dashboard/ielts/mock-tests" onClick={() => setOpen(false)}>Mock tests</Link>}</nav>}
      <nav aria-label="Account and help">{[{label:'Website guide',href:'/dashboard/guide',icon:BookOpen},{label:'Help',href:'/dashboard/support',icon:HelpCircle},{label:'Settings',href:'/dashboard/settings',icon:Settings},{label:'Website home',href:'/',icon:Globe}].map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}><item.icon size={18}/>{item.label}</Link>)}</nav>
      <button type="button" className="student-dock-signout" onClick={() => {setOpen(false);onSignOut();}}><LogOut size={18}/>Sign out</button>
    </PopoverContent>
  </Popover>;
}

export function StudentDock({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  const context = examContext(pathname);
  return <nav className="student-dock" aria-label="Student navigation">{destinations.map(item => {
    const active = item.href === '/dashboard' ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href+'/') || (item.href === '/dashboard/pte' && context?.exam === 'pte');
    return <Link key={item.href} href={item.href} className="student-dock-item" aria-current={active ? 'page' : undefined}><item.icon size={22}/><span>{item.label}</span></Link>;
  })}<StudentMoreMenu pathname={pathname} onSignOut={onSignOut}/></nav>;
}
