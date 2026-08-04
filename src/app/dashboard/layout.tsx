'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  House,
  PencilSimple,
  SignOut,
  List,
  X,
  BookmarkSimple,
  FilmSlate,
} from '@phosphor-icons/react';

const mainNav = [
  { title: 'Dashboard', href: '/dashboard', icon: House, exact: true },
];

const practiceNav = [
  { title: 'Writing', href: '/dashboard/ai-score-test/writing', icon: PencilSimple, color: 'text-violet-500', bg: 'bg-violet-500/10', activeBg: 'bg-violet-600' },
];

const toolsNav = [
  { title: 'Recorded Sessions', href: '/dashboard/recorded-sessions', icon: FilmSlate, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { title: 'Resources', href: '/resources', icon: BookmarkSimple, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

function NavItem({ item, pathname, onClick }: { item: any; pathname: string; onClick?: () => void }) {
  const Icon = item.icon;
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

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
          isActive ? 'bg-white/20' : item.bg || 'bg-muted'
        )}
      >
        <Icon
          weight="bold"
          className={cn('h-4 w-4', isActive ? 'text-white' : item.color || 'text-muted-foreground')}
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
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">PTE Platform</div>
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
          {mainNav.map(item => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={onClose} />
          ))}
        </div>

        {/* Practice Sections */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Practice Sections
          </div>
          <div className="space-y-1">
            {practiceNav.map(item => (
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
  const { user } = useUser();
  const pathname = usePathname();
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
  }, [pathname]);

  const isDesktopClient = isElectron && !isMac;

  return (
    <div className={cn('min-h-screen bg-muted/20', isDesktopClient && 'pt-8')}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar — always visible */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden lg:flex lg:flex-col w-64 bg-background/98 backdrop-blur-xl border-r border-border/60 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar — drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background border-r border-border/60 shadow-2xl lg:hidden transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Top Header */}
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-lg lg:hidden',
          isDesktopClient ? 'top-8' : 'top-0'
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

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
