'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export const QUESTION_PAGE_SIZE = 12;
export function questionBankMatches<T>(questions: T[], label: (question: T, index: number) => string, search: string) {
  const query = search.trim().toLowerCase();
  return questions.map((question, index) => ({ question, index })).filter(({ question, index }) => !query || `${index + 1} ${label(question, index)}`.toLowerCase().includes(query));
}

export function CompactQuestionBank<T>({ questions, label, selectedIndex, onSelect, disabled = false, mobileCollapse = false, heading = 'Question bank' }: {
  questions: T[]; label: (question: T, index: number) => string; selectedIndex?: number; onSelect: (index: number) => void; disabled?: boolean; mobileCollapse?: boolean; heading?: string;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [jump, setJump] = useState('');
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const matches = useMemo(() => questionBankMatches(questions, label, search), [questions, label, search]);
  const pages = Math.max(1, Math.ceil(matches.length / QUESTION_PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * QUESTION_PAGE_SIZE;
  useEffect(() => {
    const position = matches.findIndex(item => item.index === selectedIndex);
    if (position >= 0) setPage(Math.floor(position / QUESTION_PAGE_SIZE));
  }, [selectedIndex]); // Search keeps its own page; navigating a question reveals its row.
  const choose = (index: number) => { if (!disabled) { onSelect(index); setExpanded(false); } };
  return <section className="min-w-0 rounded-2xl border bg-card text-card-foreground" aria-label={heading}>
    <div className="flex items-center justify-between gap-2 border-b px-4 py-3"><div><h2 className="text-sm font-bold">{heading}</h2><p className="mt-0.5 text-xs text-muted-foreground">{questions.length} questions{selectedIndex !== undefined ? ` · current #${selectedIndex + 1}` : ''}</p></div>{mobileCollapse && <button type="button" disabled={disabled} onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={bodyId} className="flex min-h-11 items-center gap-1 rounded-xl border px-3 text-xs font-semibold disabled:opacity-50 lg:hidden">{expanded ? 'Close' : 'Choose'}<ChevronDown size={14} /></button>}</div>
    <div id={bodyId} className={mobileCollapse && !expanded ? 'hidden lg:block' : 'block'}>
      <div className="space-y-2 border-b p-3"><label className="relative block"><Search aria-hidden="true" size={15} className="absolute left-3 top-3.5 text-muted-foreground" /><input type="search" disabled={disabled} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} aria-label={`Search ${heading.toLowerCase()}`} placeholder="Search title or question number" className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 sm:text-sm" /></label><form className="flex items-center gap-2" onSubmit={event => { event.preventDefault(); const number = Number(jump); if (Number.isInteger(number) && number >= 1 && number <= questions.length) { setSearch(''); setPage(Math.floor((number - 1) / QUESTION_PAGE_SIZE)); choose(number - 1); setJump(''); } }}><label htmlFor={`${bodyId}-jump`} className="text-xs text-muted-foreground">Go to #</label><input id={`${bodyId}-jump`} type="number" min={1} max={questions.length} value={jump} disabled={disabled || !questions.length} onChange={event => setJump(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm" /><button disabled={disabled || !jump || Number(jump) < 1 || Number(jump) > questions.length} className="h-9 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40">Go</button></form></div>
      <div className="divide-y" role="group" aria-label="Available questions">{matches.slice(start, start + QUESTION_PAGE_SIZE).map(({ question, index }) => <button type="button" key={index} disabled={disabled} aria-current={index === selectedIndex ? 'true' : undefined} onClick={() => choose(index)} className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${index === selectedIndex ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted/60'}`}><span className="flex h-7 min-w-8 shrink-0 items-center justify-center rounded-lg bg-muted px-1 text-xs font-bold tabular-nums">{index + 1}</span><span className="min-w-0 flex-1 truncate" title={label(question, index)}>{label(question, index) || `Question ${index + 1}`}</span><ChevronRight size={14} className="shrink-0" aria-hidden="true" /></button>)}{!matches.length && <div className="p-5 text-center text-sm text-muted-foreground"><p>{questions.length ? 'No matching questions.' : 'No questions available yet.'}</p>{search && <button onClick={() => { setSearch(''); setPage(0); }} className="mt-2 font-semibold text-primary underline">Clear search</button>}</div>}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3"><p role="status" className="text-xs text-muted-foreground">{matches.length ? `${start + 1}–${Math.min(start + QUESTION_PAGE_SIZE, matches.length)} of ${matches.length}` : '0 results'}</p><div className="flex items-center gap-2"><button type="button" aria-label="Previous question bank page" disabled={disabled || currentPage === 0} onClick={() => setPage(currentPage - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-30"><ChevronLeft size={16} /></button><span className="text-xs tabular-nums">{currentPage + 1} / {pages}</span><button type="button" aria-label="Next question bank page" disabled={disabled || currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-30"><ChevronRight size={16} /></button></div></div>
    </div>
  </section>;
}
