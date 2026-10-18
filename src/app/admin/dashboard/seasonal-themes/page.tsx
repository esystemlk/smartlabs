'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { contrastRatio, defaultTheme, halloweenCharacters, occurrences, resolveTheme, themeSchema, type SeasonalTheme } from '@/lib/seasonal-theme/config';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CheckCircle2, Ghost, ImageIcon, Loader2, Palette, Play, RotateCcw, Save, ShieldCheck } from 'lucide-react';

type Version = { id: string; config: SeasonalTheme; createdAt: number; createdBy: string; action: string };
type Published = { config: SeasonalTheme; version: string; publishedAt: number } | null;
const tabs = ['Overview', 'Schedule', 'Appearance', 'Hero & footer', 'Motion & sound', 'Popup', 'Pages & devices', 'Assets', 'Preview & history'] as const;
const dateText = (time: number) => new Date(time).toLocaleString('en-GB', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });
const fieldClass = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}{help && <span className="block text-xs text-muted-foreground leading-relaxed">{help}</span>}</label>;
}
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-card p-5 sm:p-7 space-y-5"><div><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}</div>{children}</section>;
}

function CharacterPicker({ selected, onSelect, disabled }: { selected: string; onSelect: (src: string) => void; disabled: boolean }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {halloweenCharacters.map(character => <button
      key={character.id} type="button" disabled={disabled}
      aria-pressed={selected === character.src}
      aria-label={`Use ${character.name}`}
      onClick={() => onSelect(character.src)}
      className={`rounded-xl border-2 overflow-hidden text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${selected === character.src ? 'border-orange-500 bg-orange-500/5' : 'border-border hover:border-orange-400'}`}
    >
      <span className="block h-40 bg-[#261A38] p-3">
        <img src={character.src} alt="" width={640} height={585} loading="lazy" className="h-full w-full object-contain" />
      </span>
      <span className="block p-3"><span className="block text-sm font-semibold">{character.name}</span><span className="block mt-1 text-xs text-muted-foreground">{selected === character.src ? 'Selected in draft' : 'Use this character'}</span></span>
    </button>)}
  </div>;
}

export default function SeasonalThemesAdmin() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [config, setConfig] = useState<SeasonalTheme>(structuredClone(defaultTheme));
  const [saved, setSaved] = useState('');
  const [revision, setRevision] = useState(0);
  const [published, setPublished] = useState<Published>(null);
  const [history, setHistory] = useState<Version[]>([]);
  const [tab, setTab] = useState<typeof tabs[number]>('Overview');
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [previewPath, setPreviewPath] = useState('/');
  const [now, setNow] = useState(Date.now());
  const [simulateDate, setSimulateDate] = useState('2027-10-31T12:00');
  const [excludedYearsText, setExcludedYearsText] = useState('');
  const [excludedPathsText, setExcludedPathsText] = useState('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const dirty = saved !== '' && saved !== JSON.stringify(config);

  const headers = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) throw new Error('Sign in with an administrator account.');
    return { Authorization: `Bearer ${await current.getIdToken()}` };
  }, [auth]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/seasonal-themes', { headers: await headers(), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load settings.');
      setAllowed(true); setConfig(data.config); setSaved(JSON.stringify(data.config)); setRevision(data.revision); setPublished(data.published); setHistory(data.history);
      setExcludedYearsText(data.config.schedule.excludedYears.join(', '));
      setExcludedPathsText(data.config.routes.excluded.join('\n'));
    } catch (e) { setAllowed(false); setError(e instanceof Error ? e.message : 'Could not load settings.'); }
    finally { setLoading(false); }
  }, [headers]);
  useEffect(() => { if (!isUserLoading) { if (user) void load(); else { setLoading(false); setError('Sign in with an administrator account.'); } } }, [isUserLoading, user?.uid, load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', leave); return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);

  const update = (path: string, value: unknown) => {
    setConfig(current => {
      const next = structuredClone(current);
      const parts = path.split('.');
      let target = next as unknown as Record<string, unknown>;
      for (const part of parts.slice(0, -1)) target = target[part] as Record<string, unknown>;
      target[parts[parts.length - 1]] = value;
      return next;
    });
    setMessage('');
  };
  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setError(''); setMessage('');
    if (action !== 'off' && action !== 'restore') {
      const valid = themeSchema.safeParse(config);
      if (!valid.success) { setError(valid.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ')); return; }
    }
    setBusy(action);
    try {
      const response = await fetch('/api/admin/seasonal-themes', { method: 'POST', headers: { ...await headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ action, config, revision, ...extra }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed.');
      if (action === 'preview') {
        setPreviewUrl(`${previewPath}?seasonal-preview=1&v=${Date.now()}`); setTab('Preview & history');
        setMessage('Private preview ready for five minutes. Visitors still see the published theme.');
      } else {
        await load();
        setMessage(action === 'off' ? 'Standard theme restored. Halloween is disarmed until explicitly enabled again.' : action === 'publish' ? 'Published. Visitors receive the new settings on their next refresh (normally within 10 seconds).' : action === 'restore' ? 'Version restored as a draft. Preview and publish when ready.' : 'Draft saved. Public settings have not changed.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setBusy(''); }
  };

  const text = (label: string, path: string, value: string, help?: string, type = 'text') => <Field label={label} help={help}><input className={fieldClass} type={type} value={value} onChange={e => update(path, e.target.value)} /></Field>;
  const toggle = (label: string, path: string, value: boolean, help?: string) => <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer"><input type="checkbox" className="mt-1 h-4 w-4 accent-orange-500" checked={value} onChange={e => update(path, e.target.checked)} /><span><span className="block text-sm font-medium">{label}</span>{help && <span className="block mt-1 text-xs text-muted-foreground leading-relaxed">{help}</span>}</span></label>;
  const range = (label: string, path: string, value: number, min: number, max: number, step: number, help?: string) => <Field label={`${label}: ${value}`} help={help}><input type="range" className="w-full accent-orange-500" min={min} max={max} step={step} value={value} onChange={e => update(path, Number(e.target.value))} /></Field>;
  const assetField = (label: string, key: keyof SeasonalTheme['media'], help?: string) => <Field label={label} help={help}><div className="flex gap-2"><input className={fieldClass} value={config.media[key]} onChange={e => update(`media.${key}`, e.target.value)} /><label className="cursor-pointer rounded-lg border px-3 py-2 text-sm shrink-0">{busy === `upload-${key}` ? 'Uploading…' : 'Upload'}<input type="file" className="sr-only" disabled={!!busy} accept={key === 'audio' ? 'audio/mpeg,audio/ogg' : 'image/png,image/jpeg,image/webp'} onChange={async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Choose a file smaller than 3 MB.'); return; }
    setBusy(`upload-${key}`); setError('');
    try { const body = new FormData(); body.append('file', file); const response = await fetch('/api/admin/seasonal-themes/upload', { method: 'POST', headers: await headers(), body }); const result = await response.json(); if (!response.ok) throw new Error(result.error); update(`media.${key}`, result.url); setMessage('Asset uploaded. Save or publish to use it.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.'); } finally { setBusy(''); }
  }} /></label></div></Field>;

  if (loading && !allowed) return <div className="min-h-screen flex items-center justify-center gap-3"><Loader2 className="animate-spin" />Loading seasonal settings…</div>;
  if (!allowed) return <div className="max-w-xl mx-auto p-10 space-y-5"><ShieldCheck className="h-10 w-10" /><h1 className="text-2xl font-bold">Seasonal Themes</h1><p role="alert">{error}</p><Link href="/login" className="underline">Sign in</Link><Button onClick={() => void load()}>Retry</Button></div>;

  const liveState = published ? resolveTheme(published.config, now) : { active: false };
  const upcoming = occurrences(config, now).filter(o => o.end > now).slice(0, 3);
  const simulation = resolveTheme(config, Date.parse(`${simulateDate}:00+05:30`));
  return <div className="min-h-screen bg-background pb-20">
    <div className="border-b bg-card sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        <Link href="/admin/dashboard" className="inline-flex gap-2 items-center text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Admin dashboard</Link>
        <div className="flex flex-wrap gap-4 items-center justify-between"><div className="flex gap-3 items-center"><div className="rounded-xl p-3 bg-orange-500/10"><Ghost className="h-6 w-6 text-orange-500" /></div><div><h1 className="text-xl sm:text-2xl font-bold">Seasonal Themes</h1><p className="text-xs sm:text-sm text-muted-foreground">Halloween · {dirty ? 'Unsaved draft changes' : 'Draft saved'} · Revision {revision}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!!busy} onClick={() => void act('save')}><Save className="h-4 w-4 mr-2" />Save draft</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={() => void act('preview')}><Play className="h-4 w-4 mr-2" />Preview draft</Button><Button size="sm" disabled={!!busy} onClick={() => void act('publish')}>Publish settings</Button><Button size="sm" variant="destructive" disabled={!!busy} onClick={() => void act('off')}>Restore standard theme</Button></div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs"><span className={liveState.active ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>{liveState.active ? '● Halloween live' : published?.config.mode === 'automatic' ? '● Scheduled / outside active dates' : '● Standard theme active'}</span><span>Timezone: Asia/Colombo (UTC+05:30)</span><span>Published: {published ? dateText(published.publishedAt) : 'Never'}</span>{busy && <span className="text-orange-600">Working…</span>}</div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
      {error && <div role="alert" className="border border-red-500/40 bg-red-500/10 p-4 rounded-xl mb-5 text-sm">{error}<button className="underline ml-3" onClick={() => void load()}>Reload saved settings</button></div>}
      {message && <div role="status" className="border border-green-500/30 bg-green-500/10 p-4 rounded-xl mb-5 text-sm flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</div>}
      <nav aria-label="Theme settings" className="flex gap-2 overflow-x-auto pb-5 mb-2">{tabs.map(name => <button key={name} onClick={() => setTab(name)} aria-current={tab === name ? 'page' : undefined} className={`rounded-lg px-4 py-2.5 text-sm whitespace-nowrap border ${tab === name ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'}`}>{name}</button>)}</nav>
      <div className="space-y-6">
        {(['Hero & footer', 'Popup', 'Assets'] as readonly string[]).includes(tab) && <Section title="Halloween character collection" description="Choose a transparent companion for the homepage hero and Halloween popup. Selecting a character changes only your draft; preview and publish when ready.">
          <CharacterPicker selected={config.media.character} onSelect={src => update('media.character', src)} disabled={!!busy} />
          <p className="text-xs text-muted-foreground">Character visibility, size, corner position and gentle animation remain under your existing controls. Custom character uploads are still supported.</p>
        </Section>}
        {(tab === 'Hero & footer' || tab === 'Pages & devices') && <Section title="Characters around the website" description="Use all seven companions in dedicated spaces without covering text, buttons or forms. The original picker still controls the hero and popup character.">
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries({ homeIntro: 'Homepage welcome — ghost, owl and bat', homeCourses: 'Homepage courses — kitten and fox', homeSupport: 'Homepage learning section — robot and bunny', pageIntro: 'Public-page headings — rotating pairs', pageEnd: 'Public-page closing — different rotating pairs', footer: 'Footer gathering — all seven characters', mobile: 'Show these placements on mobile' }).map(([key, label]) => <React.Fragment key={key}>{toggle(label, `characterPlacements.${key}`, config.characterPlacements[key as keyof SeasonalTheme['characterPlacements']])}</React.Fragment>)}
          </div><p className="text-xs text-muted-foreground">The master Characters switch controls every placement. Footer art follows the Footer switch. Protected learning, payment and admin routes remain excluded. All placement changes stay in the draft until published.</p>
        </Section>}
        {(tab === 'Hero & footer' || tab === 'Assets') && <Section title="Halloween logo" description="The seasonal logo keeps the Smart Labs lettering with a witch hat, bat and warm Halloween colours. The original logo returns automatically when the theme is off.">
          {toggle('Use Halloween logo in header and footer', 'branding.enabled', config.branding.enabled)}
          <div className="rounded-xl bg-[#160F24] p-6"><img src={config.branding.logo || '/seasonal/halloween/logo-halloween.webp'} alt="Smart Labs Halloween logo preview" width={800} height={204} className="max-w-sm w-full h-auto mx-auto" /></div>
        </Section>}
        {tab === 'Overview' && <>
          <Section title="A seasonal layer you can switch off" description="Your regular website stays underneath. Drafts, previews and seasonal assets are kept separate from existing courses, payments and content.">
            <div className="grid sm:grid-cols-2 gap-5">{text('Theme name', 'name', config.name)}<Field label="Activation mode" help="Off disarms the schedule. Automatic follows the yearly calendar. Manual mode ends at its expiry and returns to Off."><select className={fieldClass} value={config.mode} onChange={e => update('mode', e.target.value)}><option value="off">Off — standard appearance</option><option value="automatic">Automatic schedule</option><option value="manual">Manual on until expiry</option></select></Field></div>
            {config.mode === 'manual' && <Field label="Manual expiry (Sri Lanka time)" help="Required. The theme automatically stops at this time."><input type="datetime-local" className={fieldClass} value={config.manualUntil ? config.manualUntil.slice(0, 16) : ''} onChange={e => update('manualUntil', e.target.value ? `${e.target.value}:00+05:30` : '')} /></Field>}
            <p className="text-sm rounded-xl bg-muted p-4">Publishing applies the selected mode and settings. “Restore standard theme” immediately publishes Off, keeps the image library, and disarms the draft. To restart, select Automatic or Manual and publish again.</p>
          </Section>
          <Section title="Area controls" description="Each part can be enabled independently. Sound and promotional popups start disabled."><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Object.entries({ palette: 'Public page colours', header: 'Header styling', hero: 'Homepage hero', footer: 'Footer artwork', characters: 'Transparent characters', animations: 'Character animation', popup: 'Halloween popup', sound: 'Optional Halloween sound', mobile: 'Mobile seasonal theme' }).map(([key, label]) => <React.Fragment key={key}>{toggle(label, `areas.${key}`, config.areas[key as keyof SeasonalTheme['areas']])}</React.Fragment>)}</div></Section>
        </>}
        {tab === 'Schedule' && <Section title="Annual Halloween calendar" description="All dates use Asia/Colombo. Start is inclusive; end is exclusive. A calendar can be prepared while the theme remains Off.">
          {toggle('Repeat every year', 'schedule.annual', config.schedule.annual, 'Reuses the approved design each year. February 29 is excluded from annual schedules.')}
          {!config.schedule.annual && <Field label="One-time year"><input className={fieldClass} type="number" min="2026" max="2100" value={config.schedule.year} onChange={e => update('schedule.year', Number(e.target.value))} /></Field>}
          <div className="grid sm:grid-cols-2 gap-6">{(['start', 'end'] as const).map(side => <div key={side} className="space-y-4 border p-4 rounded-xl"><h3 className="font-medium">{side === 'start' ? 'Starts' : 'Ends'}</h3><div className="grid grid-cols-2 gap-3"><Field label="Month"><select className={fieldClass} value={config.schedule[`${side}Month`]} onChange={e => update(`schedule.${side}Month`, Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleString('en', { month: 'long' })}</option>)}</select></Field><Field label="Day"><input className={fieldClass} type="number" min="1" max="31" value={config.schedule[`${side}Day`]} onChange={e => update(`schedule.${side}Day`, Number(e.target.value))} /></Field></div>{text('Local time', `schedule.${side}Time`, config.schedule[`${side}Time`], undefined, 'time')}</div>)}</div>
          <Field label="Skip years" help="Comma-separated years, for example 2027, 2029. Year-crossing occurrences are assigned to their start year."><input className={fieldClass} value={excludedYearsText} onChange={e => { setExcludedYearsText(e.target.value); update('schedule.excludedYears', e.target.value.split(',').map(v => v.trim()).filter(Boolean).map(Number)); }} /></Field>
          <div className="rounded-xl bg-muted p-4 space-y-3"><h3 className="font-medium flex gap-2 items-center"><Calendar className="h-4 w-4" />Upcoming occurrences</h3>{upcoming.map(o => <p key={o.id} className="text-sm">{dateText(o.start)} → {dateText(o.end)}<span className="block text-xs text-muted-foreground">UTC: {new Date(o.start).toISOString()} → {new Date(o.end).toISOString()}</span></p>)}{!upcoming.length && <p className="text-sm">No upcoming occurrence in the preview window.</p>}</div>
          <Field label="Simulate a date (Sri Lanka time)" help="Tests the draft mode and calendar only; does not change production."><input type="datetime-local" className={fieldClass} value={simulateDate} onChange={e => setSimulateDate(e.target.value)} /></Field><p className="text-sm font-medium">At that date: {simulation.active ? 'Halloween active' : 'Standard theme'}.</p>
        </Section>}
        {tab === 'Appearance' && <Section title="Halloween palette" description="Colour changes apply only on eligible public pages. Error, success and payment state colours retain their own meaning."><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Object.entries(config.colours).map(([key, value]) => <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}><div className="flex gap-3"><input aria-label={`${key} colour`} type="color" value={value} onChange={e => update(`colours.${key}`, e.target.value)} className="h-11 w-14 rounded border cursor-pointer" /><input aria-label={`${key} hex value`} className={fieldClass} value={value} onChange={e => update(`colours.${key}`, e.target.value)} /></div></Field>)}</div><div className="rounded-xl p-7 space-y-4 border" style={{ background: config.colours.background, color: config.colours.text }}><Palette className="h-6 w-6" /><h3 className="text-2xl font-bold">A little learning magic</h3><p>Your seasonal colours, with readable course information.</p><span className="inline-block rounded-lg px-4 py-2 text-sm font-bold" style={{ background: config.colours.accent, color: '#160F24' }}>Explore courses</span></div><Button variant="outline" onClick={() => update('colours', structuredClone(defaultTheme.colours))}>Reset palette</Button><p className="text-xs text-muted-foreground">Preview custom combinations before publishing. The default palette uses dark text on orange buttons. Transparent character art works over both standard and seasonal surfaces.</p></Section>}
        {tab === 'Hero & footer' && <>
          <Section title="Homepage hero" description="The seasonal hero has its own component. Turning it off reveals the existing homepage hero with its original content.">
            <div className="grid sm:grid-cols-2 gap-5">
              {assetField('Desktop hero', 'hero')}{assetField('Mobile hero', 'mobileHero', 'A separate mobile crop keeps the text readable.')}
              <Field label="Headline" help="Use a new line for the highlighted second line."><textarea className={fieldClass} rows={2} maxLength={120} value={config.hero.title} onChange={e => update('hero.title', e.target.value)} /></Field>
              {text('Greeting', 'hero.greeting', config.hero.greeting)}
              <Field label="Description"><textarea className={fieldClass} rows={3} maxLength={350} value={config.hero.body} onChange={e => update('hero.body', e.target.value)} /></Field>
              {assetField('Transparent character', 'character', 'PNG or WebP with a genuine alpha channel.')}
              {text('Primary button label', 'hero.primaryLabel', config.hero.primaryLabel)}{text('Primary destination', 'hero.primaryHref', config.hero.primaryHref)}
              {text('Secondary button label', 'hero.secondaryLabel', config.hero.secondaryLabel)}{text('Secondary destination', 'hero.secondaryHref', config.hero.secondaryHref)}
              {range('Dark overlay', 'hero.overlay', config.hero.overlay, .15, .9, .05)}{range('Character size (px)', 'hero.characterSize', config.hero.characterSize, 80, 280, 10)}
              <Field label="Character corner"><select className={fieldClass} value={config.hero.characterPosition} onChange={e => update('hero.characterPosition', e.target.value)}><option value="right">Bottom right</option><option value="left">Bottom left — compact</option></select></Field>
            </div>
          </Section>
          <Section title="Footer artwork" description="Keeps all existing footer links and information, with the seasonal art behind them.">{assetField('Footer background', 'footer')}<div className="h-40 rounded-xl bg-[#160F24] overflow-hidden">{config.media.footer && <img src={config.media.footer} alt="Footer artwork preview" className="w-full h-full object-cover object-bottom" />}</div></Section>
        </>}
        {tab === 'Motion & sound' && <>
          <Section title="Gentle character movement" description="No jump scares or flashing effects. Mobile uses static character art; reduced-motion preferences always win.">{toggle('Enable animations', 'areas.animations', config.areas.animations)}<Field label="Movement intensity"><select className={fieldClass} value={config.motion} onChange={e => update('motion', e.target.value)}><option value="low">Low — slow floating</option><option value="medium">Medium — quicker floating</option></select></Field><p className="text-sm text-muted-foreground">Visitors can pause effects or select Standard appearance. Effects pause when the tab is hidden. Animation layers cannot intercept clicks.</p></Section>
          <Section title="Opt-in sound" description="Enabling this setting offers a sound button on the homepage only. It never starts audible playback on page load.">{toggle('Offer homepage Halloween sound', 'areas.sound', config.areas.sound)}{assetField('Ambient recording (optional)', 'audio', 'Leave empty to use original synthesized ambience. Uploaded MP3/Ogg must be yours or licensed for reuse.')}{range('Maximum volume', 'volume', config.volume, 0, .25, .01)}<p className="text-sm text-muted-foreground">Sound stops when leaving the homepage, when the tab is hidden, when effects are paused, and when other website media plays. It stays stopped until the visitor turns it on again. Each new visit starts silent. Embedded video pages never offer seasonal sound.</p></Section>
        </>}
        {tab === 'Popup' && <Section title="Seasonal campaign popup" description="Existing event, workshop and webinar overlays get priority. The seasonal popup is skipped if another overlay is open at its scheduled moment.">{toggle('Enable Halloween popup', 'areas.popup', config.areas.popup)}<div className="grid sm:grid-cols-2 gap-5">{text('Title', 'popup.title', config.popup.title)}{text('Button label', 'popup.button', config.popup.button)}<Field label="Message"><textarea rows={4} className={fieldClass} maxLength={400} value={config.popup.body} onChange={e => update('popup.body', e.target.value)} /></Field>{text('Internal destination', 'popup.href', config.popup.href, 'For example /courses or /pte-registration.')}{assetField('Popup background', 'popup')}{range('Delay (seconds)', 'popup.delay', config.popup.delay, 12, 120, 1)}<Field label="Show frequency"><select className={fieldClass} value={config.popup.frequency} onChange={e => update('popup.frequency', e.target.value)}><option value="occurrence">Once per yearly occurrence</option><option value="daily">Once per day</option><option value="session">Once per browser session</option></select></Field></div><p className="text-sm text-muted-foreground">Dismissal is remembered. Copy edits do not reset it. This popup inherits the theme calendar; do not leave expired offers in recurring copy. Use evergreen text for annual reuse.</p></Section>}
        {tab === 'Pages & devices' && <Section title="Where the theme appears" description="Public marketing pages share the seasonal layer. Protected tools are excluded in code so a setting cannot introduce effects during an exam or payment.">{toggle('Homepage only', 'routes.homeOnly', config.routes.homeOnly, 'Leave unchecked for all eligible public marketing pages.')}{toggle('Enable on mobile', 'areas.mobile', config.areas.mobile, 'Mobile uses the optimised crop and static character artwork.')}<Field label="Additional excluded paths" help="One internal path per line. A path also excludes its child pages. A single / excludes the entire site."><textarea className={fieldClass} rows={6} value={excludedPathsText} onChange={e => { setExcludedPathsText(e.target.value); update('routes.excluded', e.target.value.split('\n').map(v => v.trim()).filter(Boolean)); }} /></Field><div className="rounded-xl bg-muted p-4 text-sm leading-relaxed"><h3 className="font-semibold mb-2">Protected by default</h3>Admin and developer console; student dashboards; PTE/IELTS practice and mock tests; essay/SST/WFD/SWT tools; level tests; enrolment, checkout and payment results; login/signup; partner portal; QR welcome and site status. These pages keep their current appearance and do not request seasonal settings.</div></Section>}
        {tab === 'Assets' && <Section title="Seasonal asset library" description="Bundled originals remain available every year. Upload creates a new immutable URL; it never overwrites your existing course or homepage media."><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[{ title: 'Desktop hero', file: 'hero.webp', bytes: '121 KB' }, { title: 'Mobile crop', file: 'hero-mobile.webp', bytes: '90 KB' }, { title: 'Transparent ghost scholar', file: 'ghost.webp', bytes: '62 KB' }, { title: 'Footer panorama', file: 'footer.webp', bytes: '72 KB' }].map(item => <article className="border rounded-xl overflow-hidden" key={item.file}><div className="h-40 bg-[#261A38]" style={{ backgroundImage: 'linear-gradient(45deg,#ffffff12 25%,transparent 25%),linear-gradient(-45deg,#ffffff12 25%,transparent 25%)', backgroundSize: '16px 16px' }}><img src={`/seasonal/halloween/${item.file}`} alt={item.title} className="w-full h-full object-contain" /></div><div className="p-4"><h3 className="font-medium text-sm">{item.title}</h3><p className="text-xs text-muted-foreground mt-1">Built-in generated artwork · {item.bytes}</p><a className="text-xs underline block mt-2" href={`/seasonal/halloween/${item.file}`} target="_blank" rel="noreferrer">View asset</a></div></article>)}</div><p className="text-sm text-muted-foreground">Images: PNG, JPEG, WebP. Audio: MP3 or Ogg. Maximum 3 MB per file. Custom uploads use the existing Bunny storage connection through a separate admin-only endpoint. No upload is needed to use the included artwork.</p><Button variant="outline" onClick={() => update('media', structuredClone(defaultTheme.media))}><ImageIcon className="h-4 w-4 mr-2" />Restore bundled assets in draft</Button></Section>}
        {tab === 'Preview & history' && <>
          <Section title="Private website preview" description="The draft preview is authenticated and expires after five minutes. It does not publish settings or enable Halloween for visitors."><div className="flex flex-wrap gap-3 items-end"><Field label="Page"><select className={fieldClass} value={previewPath} onChange={e => setPreviewPath(e.target.value)}><option value="/">Homepage</option><option value="/courses">Courses</option><option value="/contact">Contact</option><option value="/resources">Resources</option><option value="/blog">Blog</option></select></Field><Field label="Viewport"><select className={fieldClass} value={previewWidth} onChange={e => setPreviewWidth(e.target.value)}><option value="100%">Desktop</option><option value="390px">Mobile — 390 px</option><option value="768px">Tablet — 768 px</option></select></Field><Button disabled={!!busy} onClick={() => void act('preview')}><Play className="h-4 w-4 mr-2" />Refresh draft preview</Button><Button variant="outline" onClick={() => { setPreviewUrl(previewPath); }}>View standard/published page</Button></div><div className="rounded-xl border bg-muted p-2 overflow-x-auto">{previewUrl ? <iframe key={previewUrl} ref={frameRef} title="Private seasonal website preview" src={previewUrl} style={{ width: previewWidth, maxWidth: 'none', height: 720 }} className="block mx-auto rounded-lg border bg-background" /> : <div className="py-20 text-center text-muted-foreground">Select “Preview draft” to see your changes.</div>}</div><p className="text-xs text-muted-foreground">Preview forces the draft theme on eligible pages even when its mode is Off. Route/device exclusions and reduced-motion controls still apply. The published comparison follows the actual live configuration.</p></Section>
          <Section title="Published versions" description="Restoring a version only creates a draft. Publish it separately to make it live."><div className="space-y-3">{history.map(version => <div className="flex flex-wrap gap-3 justify-between items-center border rounded-xl p-4" key={version.id}><div><p className="text-sm font-medium">{version.action === 'off' ? 'Standard theme restored' : version.config.name} · {version.config.mode}</p><p className="text-xs text-muted-foreground mt-1">{dateText(version.createdAt)} · {version.id.slice(0, 8)} · Editor {version.createdBy.slice(0, 10)}</p></div><Button variant="outline" size="sm" disabled={!!busy} onClick={() => void act('restore', { versionId: version.id })}><RotateCcw className="h-4 w-4 mr-2" />Restore as draft</Button></div>)}{!history.length && <p className="text-sm text-muted-foreground">No published versions yet. The standard theme is still active.</p>}</div></Section>
        </>}
        {tab === 'Appearance' && <div role="status" className="rounded-xl border p-4 text-sm">Contrast ratios: text/background {contrastRatio(config.colours.text, config.colours.background).toFixed(1)}:1 · text/card {contrastRatio(config.colours.text, config.colours.surface).toFixed(1)}:1 · button {contrastRatio('#160F24', config.colours.accent).toFixed(1)}:1. Publication requires at least 4.5:1.</div>}
        {tab === 'Popup' && <Section title="Promotion expiry" description="A dated offer should not reappear automatically next Halloween. Leave empty only for evergreen copy."><Field label="Stop this popup after (Sri Lanka time)" help="The yearly visual theme can keep running after this popup expires."><input className={fieldClass} type="datetime-local" value={config.popup.expiresAt ? config.popup.expiresAt.slice(0, 16) : ''} onChange={e => update('popup.expiresAt', e.target.value ? `${e.target.value}:00+05:30` : '')} /></Field></Section>}
      </div>
    </div>
  </div>;
}
