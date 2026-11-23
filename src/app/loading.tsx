// Shown instantly while a page loads (slow connections see the layout first, then the content).
export default function Loading() {
  const block = 'rounded-[28px] bg-slate-200/70 animate-pulse';
  return (
    <div className="min-h-[70vh] w-full bg-[#f5f7fc] px-4 sm:px-6 lg:px-8 py-8" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className={`${block} h-14 w-full !rounded-full`} />
        <div className={`${block} h-56 sm:h-72 w-full`} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className={`${block} h-36`} />)}
        </div>
        <div className="space-y-3">
          <div className={`${block} h-5 w-2/3 !rounded-full`} />
          <div className={`${block} h-5 w-1/2 !rounded-full`} />
        </div>
      </div>
    </div>
  );
}
