'use client';

import { type AccessTier, formatLkr } from '@/types/recorded-package';

export function PackagePricing({ tiers, onChange }: { tiers: AccessTier[]; onChange: (tiers: AccessTier[]) => void }) {
  return <section aria-labelledby="package-pricing-heading" className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
    <div className="mb-4">
      <h3 id="package-pricing-heading" className="text-base font-bold">Package prices & access periods</h3>
      <p className="mt-1 text-sm text-muted-foreground">Choose which periods students can buy. Enter the full package price for each period in LKR.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {[1, 2, 3].map(months => {
        const tier = tiers.find(t => t.months === months);
        const duration = `${months} month${months === 1 ? '' : 's'}`;
        return <div key={months} className={`rounded-2xl border p-4 ${tier ? 'border-primary/50 bg-background shadow-sm' : 'border-dashed bg-muted/30'}`}>
          <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-bold">
            {duration} access
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!tier} aria-label={`Offer ${duration} access`}
              onChange={e => onChange((e.target.checked ? [...tiers, { months, price: 0 }] : tiers.filter(t => t.months !== months)).sort((a,b) => a.months-b.months))} />
          </label>
          {tier ? <>
            <label htmlFor={`package-price-${months}`} className="mb-2 mt-5 block text-xs font-medium text-muted-foreground">Total price (LKR)</label>
            <input id={`package-price-${months}`} type="number" min="1" step="0.01" inputMode="decimal" placeholder="Enter price" value={tier.price || ''}
              onChange={e => onChange(tiers.map(t => t.months === months ? { ...t, price: Number(e.target.value) } : t))}
              className="w-full rounded-xl border bg-background px-3 py-3 text-base font-bold outline-none focus:ring-2 focus:ring-primary" />
            <p className="mt-2 text-xs text-muted-foreground">One payment for all {duration}.</p>
          </> : <p className="mt-5 text-sm text-muted-foreground">Not offered. Enable to add a price.</p>}
        </div>;
      })}
    </div>
    <div className="mt-4 rounded-xl bg-background p-3 text-sm" aria-live="polite">
      <p className="font-semibold">Student price preview</p>
      {tiers.length ? <div className="mt-2 flex flex-wrap gap-2">{[...tiers].sort((a,b)=>a.months-b.months).map(t => <span key={t.months} className="rounded-lg border px-3 py-2">{t.months} month{t.months===1?'':'s'} · {t.price > 0 ? formatLkr(t.price) : 'Price required'}</span>)}</div> : <p className="mt-1 text-destructive">Enable at least one access period to save this package.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Grammar is included free for the same access period. These are total prices, not monthly instalments.</p>
    </div>
  </section>;
}
