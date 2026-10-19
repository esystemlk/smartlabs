'use client';
import type { CSSProperties, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSeasonalTheme } from '@/components/seasonal/seasonal-theme-provider';
import { dashboardThemeGroup } from '@/lib/seasonal-theme/dashboard-routes';
import './dashboard-seasonal.css';

export function DashboardSeasonalFrame({children}:{children:ReactNode}) {
  const {config,dashboardActive,paused}=useSeasonalTheme();
  const path=usePathname(); const d=config.dashboard;
  const exam=dashboardThemeGroup(path)==='ielts'?'ielts':'pte';
  const vars:Record<string,string>={};
  if(dashboardActive){
    Object.entries(d.colours).forEach(([key,value])=>{vars[`--ds-${key}`]=value;});
    Object.entries(d.media).forEach(([key,value])=>{vars[`--ds-${key}`]=`url("${value}")`;});
    vars['--ds-exam-image']=`url("${d.media[`${exam}-banner`]}")`;
    vars['--ds-exam-mobile']=`url("${d.media[`${exam}-banner-mobile`]}")`;
  }
  return <div className="dashboard-seasonal-frame" data-dashboard-seasonal={dashboardActive?'halloween':undefined} data-dashboard-motion={dashboardActive&&d.motion&&config.areas.animations&&!paused?'on':undefined} style={vars as CSSProperties}>{children}</div>;
}
export function DashboardSeasonalBanner(){
  const {config,dashboardAvailable,dashboardActive,preview,paused,toggleStandard,togglePause}=useSeasonalTheme();
  const path=usePathname(); const d=config.dashboard;
  if(!dashboardAvailable)return null;
  const group=dashboardThemeGroup(path);const large=group==='home'||group==='account';
  return <section className={`dashboard-seasonal-banner ${dashboardActive&&large?'dashboard-seasonal-banner-large':''}`} aria-label="Dashboard appearance">
    {dashboardActive&&large&&<picture><source media="(max-width:767px)" srcSet={d.media['home-banner-mobile']}/><img src={d.media['home-banner']} alt="" onError={e=>{e.currentTarget.style.visibility='hidden'}}/></picture>}
    <div className="dashboard-seasonal-banner-copy"><span>{preview?'Private preview · ':''}Halloween at SmartLabs</span>{dashboardActive&&large&&<><h2>{d.greeting}</h2><p>{d.body}</p></>}
      <div className="dashboard-appearance-actions"><button onClick={toggleStandard}>{dashboardActive?'Use standard appearance':'Show Halloween appearance'}</button>{dashboardActive&&d.motion&&<button onClick={togglePause} aria-pressed={paused}>{paused?'Resume animation':'Pause animation'}</button>}</div>
    </div>
    {dashboardActive&&large&&d.characters&&config.areas.characters&&<img className="dashboard-seasonal-companion" src={d.character} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}
  </section>;
}
export function DashboardExamArtwork({exam}:{exam:'pte'|'ielts'}){
  const {config,dashboardActive}=useSeasonalTheme();
  const standard=`/images/student/${exam}-hero.webp`;
  return <picture>{dashboardActive&&<source media="(max-width:767px)" srcSet={config.dashboard.media[`${exam}-banner-mobile`]}/>}<img key={dashboardActive?'seasonal':'standard'} src={dashboardActive?config.dashboard.media[`${exam}-banner`]:standard} alt="" loading="eager" width={800} height={450} onError={e=>{e.currentTarget.closest('picture')?.querySelector('source')?.remove();e.currentTarget.src=standard}}/></picture>;
}
