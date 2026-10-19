'use client';
import '@/components/dashboard/student-workspace.css';
import { searchStudentTasks, examContext } from '@/lib/student-navigation';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState, useEffect, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  House,
  PencilSimple,
  SignOut,
  List,
  X,
  BookmarkSimple,
  FilmSlate,
  Headphones,
  BookOpen,
  Microphone,
  Clock,
} from '@phosphor-icons/react';

const mainNav = [
 {title:'Home',href:'/dashboard',icon:House,exact:true},
 {title:'PTE Academic',href:'/dashboard/pte',icon:Microphone},
 {title:'IELTS',href:'/dashboard/ielts',icon:BookOpen},
 {title:'My Registrations',href:'/dashboard/registrations',icon:BookmarkSimple},
 {title:'Results',href:'/dashboard/results',icon:Clock},
 {title:'Help',href:'/dashboard/support',icon:Headphones},
];
const practiceNav = ['speaking','writing','reading','listening'].map((skill,i)=>({title:skill[0].toUpperCase()+skill.slice(1),href:'/dashboard/pte/'+skill,icon:[Microphone,PencilSimple,BookOpen,Headphones][i]}));
const toolsNav = [{title:'Settings',href:'/dashboard/settings',icon:BookmarkSimple},{title:'Website home',href:'/',icon:House}];

const ieltsNav = [
  { title: 'Listening', href: '/dashboard/ielts/listening', icon: Headphones },
  { title: 'Reading', href: '/dashboard/ielts/reading', icon: BookOpen },
  { title: 'Writing', href: '/dashboard/ielts/writing', icon: PencilSimple },
  { title: 'Speaking', href: '/dashboard/ielts/speaking', icon: Microphone },
  { title: 'Mock tests', href: '/dashboard/ielts/mock-tests', icon: Clock },
];

function NavItem({ item, pathname, onClick }: { item: any; pathname: string; onClick?: () => void }) {
  const Icon = item.icon;
  const context = examContext(pathname);
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) || (context?.exam === 'pte' && (item.href === '/dashboard/pte' || item.href === '/dashboard/pte/'+context.skill));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0',
          isActive ? 'bg-white/20' : pathname.startsWith('/dashboard/ielts') ? 'bg-primary/5' : item.bg || 'bg-muted'
        )}
      >
        <Icon
          weight="bold"
          className={cn('h-4 w-4', isActive ? 'text-white' : pathname.startsWith('/dashboard/ielts') ? 'text-primary' : item.color || 'text-muted-foreground')}
        />
      </div>
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isIelts = pathname.startsWith('/dashboard/ielts');

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0" onClick={onClose}>
          <Image src="/logo.png" alt="SmartLabs" width={38} height={38} className="rounded-xl shrink-0" />
          <div className="min-w-0">
            <div className="font-black text-sm tracking-tight">SMARTLABS</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Student Space</div>
          </div>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden shrink-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Home */}
        <div className="space-y-1">
          {(isIelts ? [{ title: 'IELTS overview', href: '/dashboard/ielts', icon: House, exact: true }, { title: 'Back to PTE', href: '/dashboard', icon: House, exact: true }] : [...mainNav, { title: 'IELTS Studio', href: '/dashboard/ielts', icon: BookOpen, exact: false }]).map(item => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={onClose} />
          ))}
        </div>

        {/* Exam skills */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {isIelts ? 'IELTS skills' : 'PTE skills'}
          </div>
          <div className="space-y-1">
            {(isIelts ? ieltsNav : practiceNav).map(item => (
              <NavItem key={item.href} item={item} pathname={pathname} onClick={onClose} />
            ))}
          </div>
        </div>

        {/* More */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            More
          </div>
          <div className="space-y-1">
            {toolsNav.map(item => (
              <NavItem key={item.href} item={item} pathname={pathname} onClick={onClose} />
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20 shrink-0">
            <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
            <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black truncate">{user?.displayName || 'Student'}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
            onClick={handleLogout}
            title="Sign out"
          >
            <SignOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(()=>{if(!isUserLoading && !user)router.replace('/login?redirect='+encodeURIComponent(pathname));},[user,isUserLoading,router,pathname]);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const runningInElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
    setIsElectron(runningInElectron);
    if (runningInElectron) setIsMac(navigator.userAgent.includes('Mac'));
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setSearch('');
  }, [pathname]);

  const isDesktopClient = isElectron && !isMac;
  // "Exam mode": while a student is doing a test, hide the sidebar (burger only)
  // so the questions get the full width — on desktop as well as mobile.
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
      {/* Overlay behind the drawer (also on desktop in exam mode) */}
      {sidebarOpen && (
        <div
          className={cn('fixed inset-0 z-40 bg-black/60 backdrop-blur-sm', !isExam && 'lg:hidden')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar — hidden during a test so the questions get full width */}
      {!isExam && (
        <aside className="fixed inset-y-0 left-0 z-50 hidden lg:flex lg:flex-col w-64 bg-background/98 backdrop-blur-xl border-r border-border/60 shadow-xl">
          <SidebarContent />
        </aside>
      )}

      {/* Sidebar drawer — mobile always; desktop too in exam mode */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background border-r border-border/60 shadow-2xl transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          !isExam && 'lg:hidden'
        )}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Top header with burger — mobile always; desktop too in exam mode */}
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-lg',
          isDesktopClient ? 'top-8' : 'top-0',
          !isExam && 'lg:hidden'
        )}
      >
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSidebarOpen(true)}>
          <List weight="bold" className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SmartLabs" width={28} height={28} />
          <span className="font-black text-sm">SmartLabs</span>
        </Link>
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
          <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Main content — offset by sidebar width, except in exam mode (full width) */}
      <main className={cn('min-h-screen', !isExam && 'lg:ml-64')}>
        <div className="p-4 sm:p-6 lg:p-8">{!isExam && <div className="student-search"><label className="sr-only" htmlFor="practice-search">Find PTE or IELTS practice</label><input id="practice-search" type="search" placeholder="Find practice: PTE writing, IELTS reading…" value={search} onChange={event=>setSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setSearch('')}}/>{search.trim() && <div className="student-search-results">{searchStudentTasks(search).length ? searchStudentTasks(search).map(item=><Link key={item.href} href={item.href} onClick={()=>setSearch('')}>{item.label}<small>{item.context}</small></Link>):<p className="p-4 text-sm">No matching practice. Try an exam or skill name.</p>}</div>}</div>}{children}</div>
      </main>
      {!isExam && <nav className="student-mobile-nav" aria-label="Student navigation"><Link href="/dashboard">Home</Link><Link href="/dashboard#choose-exam">Practice</Link><Link href="/dashboard/registrations">Registrations</Link><Link href="/dashboard/results">Results</Link><button onClick={()=>setSidebarOpen(true)}>More</button></nav>}
    </div>
  );
}
