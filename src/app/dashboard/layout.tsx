'use client';
import '@/components/dashboard/student-workspace.css';
import { searchStudentTasks } from '@/lib/student-navigation';

import Link from 'next/link';
import { DashboardSeasonalFrame, DashboardSeasonalBanner } from '@/components/dashboard/dashboard-seasonal';
import { useSeasonalTheme } from '@/components/seasonal/seasonal-theme-provider';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { StudentDock, StudentMoreMenu } from '@/components/dashboard/student-dock';
import { DashboardHero, type DashboardArt } from '@/components/dashboard/student-views';
import { isStudioHost } from '@/lib/studio';

// Banners for pages whose own code has no hero (their content renders underneath).
const PAGE_HEROES: Record<string, { image: DashboardArt; eyebrow: string; title: string; text: string }> = {
  '/dashboard/recorded-sessions': { image: 'recorded', eyebrow: 'RECORDED COURSES', title: 'Watch your classes', text: 'Your recorded lessons and course videos, ready whenever you are.' },
  '/dashboard/support': { image: 'help', eyebrow: 'HELP CENTRE', title: "We're here to help", text: 'Ask a question or chat with our team about your courses and practice.' },
  '/dashboard/settings': { image: 'help', eyebrow: 'YOUR ACCOUNT', title: 'Settings', text: 'Update your profile, password and preferences.' },
  '/dashboard/guide': { image: 'help', eyebrow: 'WEBSITE GUIDE', title: 'Find your way around', text: 'A quick tour of practice, results, registrations and courses.' },
};

// IELTS practice now lives on ielts.smartlabs.lk, so the dashboard search only lists PTE and general pages.
const pteResults = (q: string) => searchStudentTasks(q).filter(item => !item.href.startsWith('/dashboard/ielts'));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const {dashboardActive}=useSeasonalTheme();
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

  // IELTS Studio domain: same IELTS pages, Studio branding and no Smart Labs (PTE) navigation.
  const [studio, setStudio] = useState(false);
  useEffect(() => { setStudio(isStudioHost(window.location.host)); }, []);

  const isDesktopClient = isElectron && !isMac;
  // Keep the floating dock out of timed IELTS tests.
  const isExam = /^\/dashboard\/ielts\/(listening|reading|writing)\/cambridge-/.test(pathname)
    || /^\/dashboard\/ielts\/mock-tests\/mock-/.test(pathname);

  if(isUserLoading || !user) return <div className="p-8" role="status">Loading your student space…</div>;
  return (
    <DashboardSeasonalFrame><div className={cn('student-workspace min-h-screen', isDesktopClient && 'pt-8')}
      style={!dashboardActive && pathname.startsWith('/dashboard/ielts') ? {
        '--primary': '358 79% 47%', '--primary-foreground': '0 0% 100%',
        '--background': '0 0% 100%', '--foreground': '0 0% 13%',
        '--muted': '0 0% 95%', '--muted-foreground': '0 0% 38%',
        '--border': '0 0% 88%', '--accent': '358 100% 97%',
        '--accent-foreground': '0 0% 13%', '--ring': '358 79% 47%',
      } as CSSProperties : undefined}>
      <header className={cn('student-workspace-header', isDesktopClient && 'student-header-desktop')}>
        {studio
          ? <Link href="/studio" className="student-workspace-brand"><Image src="/studio/logo.png" alt="" width={34} height={34} /><span>IELTS Studio<small>Back to dashboard</small></span></Link>
          : <Link href="/dashboard" className="student-workspace-brand"><Image src="/logo.png" alt="SmartLabs" width={34} height={34} /><span>SmartLabs<small>Student Space</small></span></Link>}
        <div className="flex items-center gap-3">{isExam && !studio && <StudentMoreMenu pathname={pathname} onSignOut={handleLogout} includeNavigation/>}<Link href={studio ? '/studio' : '/dashboard/settings'} aria-label={studio ? 'IELTS Studio dashboard' : 'Account settings'}><Avatar className="h-9 w-9"><AvatarImage src={user?.photoURL ?? ''} alt=""/><AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback></Avatar></Link></div>
      </header>

      {/* Full-width content; reserve space for the floating dock outside exams. */}
      <main className={cn('min-h-screen', !isExam && !studio && 'student-dock-content')}>
        <div className="p-4 sm:p-6 lg:p-8">{!isExam && !studio && <div className="student-search"><label className="sr-only" htmlFor="practice-search">Find PTE practice</label><input id="practice-search" type="search" placeholder="Find PTE practice: speaking, essay, dictation…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setSearch('')}}/>{search.trim() && <div className="student-search-results">{pteResults(search).length ? pteResults(search).map(item=><Link key={item.href} href={item.href} onClick={()=>setSearch('')}>{item.label}<small>{item.context}</small></Link>):<p className="p-4 text-sm">No matching practice. Try a skill or task name.</p>}</div>}</div>}<DashboardSeasonalBanner/>{PAGE_HEROES[pathname] && <div className="student-page dash-page-hero"><DashboardHero {...PAGE_HEROES[pathname]} /></div>}{children}</div>
      </main>
      {!isExam && !studio && <StudentDock pathname={pathname} onSignOut={handleLogout}/>}
    </div></DashboardSeasonalFrame>
  );
}
