'use client';
import '@/components/dashboard/student-workspace.css';
import { searchStudentTasks } from '@/lib/student-navigation';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { StudentDock, StudentMoreMenu } from '@/components/dashboard/student-dock';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(()=>{if(!isUserLoading && !user)router.replace('/login?redirect='+encodeURIComponent(pathname));},[user,isUserLoading,router,pathname]);
  const [search, setSearch] = useState('');
  const auth = useAuth();
  const handleLogout = async () => { if (auth) { await signOut(auth); router.push('/login'); } };
  const [isElectron, setIsElectron] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const runningInElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
    setIsElectron(runningInElectron);
    if (runningInElectron) setIsMac(navigator.userAgent.includes('Mac'));
  }, []);

  // Clear search on route change
  useEffect(() => {
    setSearch('');
  }, [pathname]);

  const isDesktopClient = isElectron && !isMac;
  // Keep the floating dock out of timed IELTS tests.
  const isExam = /^\/dashboard\/ielts\/(listening|reading|writing)\/cambridge-/.test(pathname)
    || /^\/dashboard\/ielts\/mock-tests\/mock-/.test(pathname);

  if(isUserLoading || !user) return <div className="p-8" role="status">Loading your student space…</div>;
  return (
    <div className={cn('student-workspace min-h-screen', isDesktopClient && 'pt-8')}
      style={pathname.startsWith('/dashboard/ielts') ? {
        '--primary': '358 79% 47%', '--primary-foreground': '0 0% 100%',
        '--background': '0 0% 100%', '--foreground': '0 0% 13%',
        '--muted': '0 0% 95%', '--muted-foreground': '0 0% 38%',
        '--border': '0 0% 88%', '--accent': '358 100% 97%',
        '--accent-foreground': '0 0% 13%', '--ring': '358 79% 47%',
      } as CSSProperties : undefined}>
      <header className={cn('student-workspace-header', isDesktopClient && 'student-header-desktop')}>
        <Link href="/dashboard" className="student-workspace-brand"><Image src="/logo.png" alt="SmartLabs" width={34} height={34} /><span>SmartLabs<small>Student Space</small></span></Link>
        <div className="flex items-center gap-3">{isExam && <StudentMoreMenu pathname={pathname} onSignOut={handleLogout} includeNavigation/>}<Link href="/dashboard/settings" aria-label="Account settings"><Avatar className="h-9 w-9"><AvatarImage src={user?.photoURL ?? ''} alt=""/><AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback></Avatar></Link></div>
      </header>

      {/* Full-width content; reserve space for the floating dock outside exams. */}
      <main className={cn('min-h-screen', !isExam && 'student-dock-content')}>
        <div className="p-4 sm:p-6 lg:p-8">{!isExam && <div className="student-search"><label className="sr-only" htmlFor="practice-search">Find PTE or IELTS practice</label><input id="practice-search" type="search" placeholder="Find practice: PTE writing, IELTS reading…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setSearch('')}}/>{search.trim() && <div className="student-search-results">{searchStudentTasks(search).length ? searchStudentTasks(search).map(item=><Link key={item.href} href={item.href} onClick={()=>setSearch('')}>{item.label}<small>{item.context}</small></Link>):<p className="p-4 text-sm">No matching practice. Try an exam or skill name.</p>}</div>}</div>}{children}</div>
      </main>
      {!isExam && <StudentDock pathname={pathname} onSignOut={handleLogout}/>}
    </div>
  );
}
