'use client';
import {IeltsText} from '@/components/ielts/ielts-text';
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {doc,getDoc} from 'firebase/firestore';
import {signOut} from 'firebase/auth';
import {useUser,useAuth,useFirebase} from '@/firebase';
import {Search,LayoutDashboard,ArrowUpRight,LogOut,Menu,ShieldCheck} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {adminNavigation} from '@/lib/admin-navigation';
import './admin-workspace.css';

export function AdminNavigation({pathname,role,onNavigate}:{pathname:string;role:string;onNavigate?:()=>void}){
  const [search,setSearch]=useState('');
  return <><label className="admin-tool-search"><Search size={16}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find an admin tool…" aria-label="Find an admin tool"/></label><nav aria-label="Administration"><Link className="admin-nav-overview" aria-current={pathname==='/admin/dashboard'?'page':undefined} href="/admin/dashboard" onClick={onNavigate}><LayoutDashboard size={18}/>Overview</Link>{adminNavigation.map(group=>{const items=group.items.filter(item=>(!item.developerOnly||role==='developer')&&`${item.title} ${item.description} ${group.title}`.toLowerCase().includes(search.toLowerCase().trim()));return items.length>0&&<div className="admin-nav-group" key={group.title}><h2>{group.title}</h2>{items.map(item=><Link key={item.href} href={item.href} onClick={onNavigate} aria-current={pathname===item.href||(item.href!=='/admin/dashboard/payments'&&pathname.startsWith(item.href+'/'))?'page':undefined}><IeltsText>{item.title}</IeltsText>{item.href==='/partners/admin'&&<ArrowUpRight size={13}/>}</Link>)}</div>})}{search.trim()&&!adminNavigation.some(group=>group.items.some(item=>(!item.developerOnly||role==='developer')&&`${item.title} ${item.description} ${group.title}`.toLowerCase().includes(search.toLowerCase().trim())))&&<p className="admin-nav-empty">No matching tool. Try payments, users or themes.</p>}</nav></>;
}
export function AdminShell({children}:{children:ReactNode}){
  const {user,isUserLoading}=useUser();const {firestore}=useFirebase();const auth=useAuth();const router=useRouter();const pathname=usePathname();
  const [access,setAccess]=useState<{uid:string;role:string}|null>(null);const [error,setError]=useState(false);const [retry,setRetry]=useState(0);const [open,setOpen]=useState(false);
  useEffect(()=>{let cancelled=false;setAccess(null);setError(false);if(isUserLoading)return;if(!user){router.replace('/login?redirect='+encodeURIComponent(pathname));return;}if(!firestore)return;
    getDoc(doc(firestore,'users',user.uid)).then(snap=>{if(cancelled)return;const role=snap.data()?.role;if(['admin','developer','teacher'].includes(role))setAccess({uid:user.uid,role});else router.replace('/dashboard');}).catch(()=>{if(!cancelled)setError(true)});return()=>{cancelled=true};
  },[user?.uid,isUserLoading,firestore,router,retry]);
  useEffect(()=>{setOpen(false)},[pathname]);
  if(!user||access?.uid!==user.uid)return <div className="admin-access-state" role="status"><ShieldCheck size={32}/><h1>{error?'Unable to verify access':'Checking admin access…'}</h1><p>{error?'Your admin tools remain locked. Try again when your connection is available.':'Please wait while we check your account permissions.'}</p>{error&&<button onClick={()=>setRetry(value=>value+1)}>Try again</button>}<Link href="/dashboard">Return to student space</Link></div>;
  const current=adminNavigation.flatMap(group=>group.items).filter(item=>pathname===item.href||pathname.startsWith(item.href+'/')).sort((a,b)=>b.href.length-a.href.length)[0];
  const logout=async()=>{if(auth){await signOut(auth);router.replace('/login')}};
  return <div className="admin-workspace"><aside className="admin-sidebar"><Link className="admin-brand" href="/admin/dashboard"><img src="/logo.png" width="36" height="36" alt=""/><span>SmartLabs<small>Administration</small></span></Link><AdminNavigation pathname={pathname} role={access.role}/><div className="admin-sidebar-footer"><span><ShieldCheck size={14}/>{access.role}</span><Link href="/dashboard">Student view <ArrowUpRight size={14}/></Link><Link href="/">Website <ArrowUpRight size={14}/></Link><button onClick={()=>void logout()}><LogOut size={14}/>Sign out</button></div></aside>
    <div className="admin-workspace-body"><header className="admin-topbar"><button className="admin-mobile-toggle" aria-label="Open admin navigation" onClick={()=>setOpen(true)}><Menu size={22}/></button><div><span>SmartLabs administration</span><p><IeltsText>{current?.title||'Overview'}</IeltsText></p></div><div className="admin-topbar-actions"><Link href="/admin/dashboard/seasonal-themes">Seasonal themes</Link><Link href="/dashboard">Student view <ArrowUpRight size={14}/></Link></div></header><main className="admin-main" id="admin-main-content">{children}</main></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="admin-mobile-dialog max-h-[90dvh] overflow-y-auto"><DialogTitle>Admin navigation</DialogTitle><DialogDescription>Find a tool or choose a section.</DialogDescription><AdminNavigation pathname={pathname} role={access.role} onNavigate={()=>setOpen(false)}/><Link href="/dashboard">Student view</Link><button onClick={()=>void logout()}>Sign out</button></DialogContent></Dialog>
  </div>;
}
