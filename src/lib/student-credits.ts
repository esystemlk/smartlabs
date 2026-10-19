import { FREE_MOCK_LIMIT } from './mock-packages';
import { FREE_IELTS_MOCK_LIMIT } from './ielts-mock-packages';

type Account = Record<string, unknown>;
export interface CreditBalance { id: string; label: string; paid: number; free: number; unlimited: boolean; expires: number | null; href: string; description: string }
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
function expiry(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') return expiry((value as { toDate(): Date }).toDate());
  return null;
}
export function studentCreditBalances(account: Account, now = Date.now()) {
  const staff = ['admin', 'developer', 'teacher'].includes(String(account.role));
  const active = (value: unknown) => { const ms = expiry(value); return ms !== null && ms > now ? ms : null; };
  // Mock servers accept Firestore Timestamp expiries; AI pools also accept Date/epoch-ms.
  const mockActive = (value: unknown) => value && typeof (value as { toDate?: unknown }).toDate === 'function' ? active(value) : null;
  const universal = active(account.universalMonthlyExpiry);
  const bundle = mockActive(account.bundleExpiry);
  const main: CreditBalance[] = [{ id:'universal', label:'AI scoring credits', paid:count(account.universalPaidCredits), free:0, unlimited:staff || universal !== null, expires:staff ? null : universal, href:'/credits', description:'Shared across supported PTE and IELTS AI scoring tools.' }];
  for (const [id,label,paidField,freeField,monthlyField,freeLimit,href] of [
    ['pte-mock','PTE mock credits','mockPaidCredits','mockFreeUsed','mockMonthlyExpiry',FREE_MOCK_LIMIT,'/mock-tests'],
    ['ielts-mock','IELTS mock credits','ieltsMockPaidCredits','ieltsMockFreeUsed','ieltsMockMonthlyExpiry',FREE_IELTS_MOCK_LIMIT,'/dashboard/ielts/mock-tests'],
  ] as const) {
    const plan = mockActive(account[monthlyField]);
    main.push({ id,label,paid:count(account[paidField]),free:Math.max(0,freeLimit-count(account[freeField])),unlimited:staff || plan !== null || bundle !== null,expires:staff ? null : Math.max(plan ?? 0,bundle ?? 0) || null,href,description:'Separate from AI scoring credits. One credit starts one mock attempt.' });
  }
  const additional: CreditBalance[] = [
    ['essay','Write Essay','essayPaidCredits','essayMonthlyExpiry'],
    ['swt','Summarize Written Text','swtPaidCredits','swtMonthlyExpiry'],
    ['sst','Summarize Spoken Text','sstPaidCredits','sstMonthlyExpiry'],
    ['speaking','Speaking','speakingPaidCredits','speakingMonthlyExpiry'],
    ['ielts','IELTS Essay','ieltsEssayPaidCredits','ieltsEssayMonthlyExpiry'],
  ].map(([id,label,paidField,monthlyField]) => { const plan=active(account[monthlyField]);return {id,label,paid:count(account[paidField]),free:0,unlimited:plan!==null,expires:plan,href:'/credits',description:'Task-specific balance; separate from your shared AI credits.'}; }).filter(balance=>balance.paid>0||balance.unlimited);
  const generation=count(account.essayGenCredits);
  if(generation>0)additional.push({id:'essay-generation',label:'Essay generation',paid:generation,free:0,unlimited:false,expires:null,href:'/ai-essay-practice',description:'Separate essay-generation credits.'});
  return {main,additional};
}
