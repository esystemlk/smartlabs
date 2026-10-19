import { matchesPath, type SeasonalTheme } from './config';

export type DashboardThemeGroup = 'home'|'pte'|'ielts'|'account';
export function dashboardThemeGroup(pathname:string):DashboardThemeGroup|null {
  if(pathname==='/dashboard')return 'home';
  if(/^\/dashboard\/pte(?:\/(speaking|writing|reading|listening))?$/.test(pathname))return 'pte';
  if(/^\/dashboard\/ielts(?:\/(speaking|writing|reading|listening|mock-tests))?$/.test(pathname))return 'ielts';
  if(['/dashboard/registrations','/dashboard/results','/dashboard/settings','/dashboard/support','/dashboard/certificate-request','/dashboard/guide'].includes(pathname))return 'account';
  return null;
}
export function eligibleDashboardRoute(pathname:string,config:SeasonalTheme){
  const group=dashboardThemeGroup(pathname);
  return config.id==='halloween' && config.dashboard.enabled && group!==null && config.dashboard.pages[group] && !config.routes.excluded.some(path=>path==='/'||matchesPath(pathname,path));
}
