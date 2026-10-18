# Smart Labs Christmas seasonal theme — implementation plan

Prepared: 18 October 2026. This is the original planning snapshot. Implementation is now documented in `christmas-seasonal-operations.md` and generated assets in `christmas-image-production.md`. The user's later instruction keeps the same seven Halloween mascot identities in Christmas clothing, replacing the alternate cast proposed below. Live configuration and activation remain separate administrator actions.

## 1. Intended experience

Create a reusable December Christmas theme called **Christmas Learning Village**. Retain the Smart Labs identity and learning content, with a warm illuminated study room, festive greenery, books, friendly characters and restrained snow. Admins can save, preview, publish, schedule annually and restore standard appearance without a deployment.

Recommended default: annual activation from **1 December at 00:00 until 1 January at 00:00, Asia/Colombo**, with an inclusive start and exclusive end. The 2026 occurrence therefore ends on 1 January 2027. Dates remain editable. Do not extend Christmas into a separate New Year campaign automatically.

Halloween and Christmas must coexist as independent presets and published schedules. Creating Christmas must not replace the saved Halloween draft, assets, annual schedule or history. Only one seasonal appearance may be effective at a time. Outside both schedules, retain the normal website and the visitor's existing light/dark preference.

## 2. Visual direction

| Element | Proposed treatment |
|---|---|
| Mood | Premium, friendly, cosy learning village; warm light against deep evergreen and midnight blue |
| Main palette | Background `#0C2020`, surface `#163532`, ivory text `#FFF7E8`, gold action `#F6C66A`, cranberry `#B83C4B`, icy secondary `#A9DCE8` |
| Text | Ivory on dark surfaces; dark `#0C2020` lettering on gold buttons; muted text tested on each real surface |
| Logo | Preserve SMART/LABS lettering, triangular A, dot and horizontal rules; add a small Santa hat, restrained gold/ivory treatment and tiny holly accent |
| Hero | Illustrated Christmas study room with tree, books, window and distant village; clear left-side copy space and illustration on the right |
| Cards and sections | Evergreen surfaces, warm borders, occasional small ornaments; keep real course data, prices, reviews and CTAs |
| Footer | Low festive village/books/garland scene with a strong readable overlay |
| Popup | Optional seasonal message with transparent character and readable card; disabled by default |

These are design candidates, not a verified accessibility palette. Validate actual text, status, button, hover and focus combinations before publication. Avoid a blanket white-text override: the Halloween contrast issue showed why button labels and legacy light cards need contextual treatment. Keep existing success/error/warning meanings distinct.

Snow is a decorative Christmas illustration, not a claim about local December weather. Avoid full white backgrounds that clash with the site's seasonal dark surfaces.

## 3. Coverage and character placements

| Surface | Christmas design | Controls |
|---|---|---|
| Header | Seasonal logo; subtle festive border, optional static string-light ornament | Header styling, Christmas logo and mobile visibility |
| Homepage hero | Responsive Christmas artwork, moving scene, optional snow, selected lead character | Desktop/mobile artwork, overlays, text, CTAs, character size/corner, motion |
| Homepage welcome scene | Santa scholar, snowy owl and book robin | Independent placement toggle |
| Homepage course scene | Reindeer learner and festive fox | Independent placement toggle |
| Homepage learning/help scene | Snowman tutor and gift robot | Independent placement toggle |
| Footer gathering | All seven companions above the existing footer | Independent placement and footer toggles |
| Other eligible public pages | Small route-dependent pairs near introduction and ending | Intro/end toggles, route exclusions, mobile visibility |
| Popup | Selected character, optional background and campaign copy | Separate toggle, delay, frequency, expiry and CTA |
| Protected routes | Preserve existing appearance and behaviour | Existing protected-route policy remains authoritative |

Proposed seven-character set: Santa scholar holding a book; snowy owl with scarf; robin carrying a small book; friendly reindeer learner; festive fox with scarf; snowman tutor; gift-carrying learning robot. All share a premium rounded illustrated style, complete silhouettes and transparent backgrounds. Avoid decorations over forms or text. Use in-flow spaces for character groups, as in the Halloween implementation.

Keep account, admin, payments, registration checkout steps, assessments, recording, listening and practice tools protected under the actual current route policy. Do not broaden eligibility while adding this preset. Existing public marketing registration pages may receive decoration only where already eligible.

## 4. Animation and sound

| Effect | Default | Admin choices and limits |
|---|---|---|
| Hero scene drift | On with animation master | Independent switch; slow transform-only background movement; pause offscreen |
| Warm window/tree glow | On with hero motion | Gentle opacity variation, no flashing or rapid sparkle |
| Snowflakes | On, hero only | Off / hero / homepage screen / eligible public website; Low 12, Medium 24 particles on desktop |
| Mobile snow/motion | Off | Explicit opt-in; at most 6 small particles; no horizontal overflow |
| Sleigh silhouette | Off | Optional occasional pass; homepage hero or homepage screen only; no site-wide default |
| Character float | Low | Reuse master switch, Low/Medium and existing per-placement behaviour |
| Ambient sound | Off | Offer visitor sound button on homepage; never audible autoplay |
| Greeting popup | Off | Reuse promotion priority, expiry and frequency controls |

Snow and sleigh layers must be decorative, aria-hidden and pointer-events:none. Keep navigation, dialogs, media and appearance controls above effects. Avoid large high-contrast flakes passing across headlines. Use original code-native vectors/CSS for snow and sleigh rather than downloading animated videos or large GIFs.

Visitor Pause effects freezes every seasonal animation; hidden tabs stop animation and audio. Reduced-motion visitors get a still hero without snow/sleigh/glow animation. Standard appearance removes seasonal visuals, motion and sound. Mobile remains still unless explicitly enabled.

Audio direction: quiet original bell/pad ambience, optionally generated with existing Web Audio support; alternatively an admin-uploaded owned/licensed loop. Do not copy a commercial Christmas recording. If an original recording is produced, record its author/source and usage rights. Existing learning media always takes priority; stop ambience on other media playback and do not resume without visitor input.

## 5. Detailed admin panel

Extend the existing `/admin/dashboard/seasonal-themes` panel; do not introduce a second competing theme manager.

### Theme library and persistent actions

- Preset selector: Halloween / Christmas, each showing Off, Scheduled, Live or Draft-only.
- Show the effective live theme separately from the selected draft; include next start/end in Asia/Colombo, published version and last editor.
- Actions: Save draft, Preview selected draft, Publish selected theme, Disable selected theme, Restore standard appearance for all seasons, Version history.
- Keep selected-theme disabling distinct from the global emergency off. Explain the exact scope before each action; never silently disable Halloween when saving Christmas.
- Drafts and unpublished schedules never influence the public resolver. Show unsaved changes, validation failures, publication success and revision conflicts clearly.

### Overview

Theme name, effective status, activation mode (Off / Automatic / Manual until expiry), area switches and a readable summary of the next annual occurrence. Include one summary line such as “Christmas repeats 1 December–1 January; Halloween remains scheduled separately.”

### Schedule

Annual repeat, start/end month/day/time, optional one-time campaign year, excluded occurrence years, Manual expiry, and upcoming three occurrences. Label January end dates with their actual next year. An exclusion refers to the occurrence's start year: excluding 2026 skips the complete December 2026–January 2027 window.

Preview schedule conflicts with other published seasons before publishing. Use one deterministic winner: a valid manual override first, then an automatically active preset with higher explicit priority, then stable theme ID as a tie-breaker. Default Halloween and Christmas dates do not overlap. Show conflict warnings and the winner in the panel; never layer both palettes or play two soundtracks.

### Appearance

Approved Christmas palette, readable button/text pair previews, surface/border values, reset-to-Christmas defaults, and existing compatibility handling for fixed light-theme colours. Palette validation must include all required foreground/background combinations. Reuse cleanup of private seasonal variables and attributes when switching themes.

### Hero & footer

Separate desktop/mobile hero images, footer image, seasonal logo toggle, selected lead character, size/corner, overlay strength, hero title/greeting/body and existing internal CTA destinations. Retain existing content by default except approved seasonal copy. Keep minimum safe overlays for readability.

### Characters around the website

Independent switches for welcome, courses, learning/help, public-page introduction, public-page ending, footer cast and mobile placement. Show the character group associated with each switch. The character master disables all these placements without changing the underlying page content.

### Motion & sound

Animation master; hero motion; glow; snow enable/scope/density; optional sleigh/scope; mobile motion opt-in; character intensity; opt-in sound, audio asset and maximum volume. Explain reduced-motion behaviour and visitor pause controls. Provide a local panel preview that can be paused without publishing.

### Popup

Enable switch, title/body/button/internal link, background/character, bounded delay, session/daily/occurrence frequency and explicit promotion expiry. Keep evergreen visuals separate from time-limited discounts. Use theme ID plus occurrence ID in dismissal keys so Halloween dismissal never suppresses Christmas and a new Christmas year gets its own identity.

### Pages & devices

Homepage-only or eligible public pages, existing path exclusions, mobile seasonal appearance and individual character/motion mobile controls. Protected routes cannot be enabled by a checkbox. Explain that site-wide snow still respects exclusions and visitor preferences.

### Assets; preview & history

Filter assets by selected theme; show thumbnails, dimensions, transparency, file size and purpose. Restrict uploads to the selected season's approved paths and configured CDN. Provide private expiring draft previews for homepage, courses and contact in desktop/mobile sizes. Version history and draft restore are theme-specific; restoring a version never publishes automatically.

## 6. Required image and media pack

Proposed destination: `public/seasonal/christmas/`. Preserve PNG masters and prompt/provenance records under `docs/seasonal-asset-sources/christmas/`. Delivery dimensions are targets to confirm after generation and visual inspection.

| Asset | Target output | Composition and purpose |
|---|---|---|
| `hero.webp` | 1920 × 1080, target ≤400 KB | Wide Christmas study room; left ~45% quiet copy space; books/tree/window to right; no baked-in text |
| `hero-mobile.webp` | 900 × 1200, target ≤220 KB | Purpose-composed portrait view; text-safe centre/top, small decorations at edges |
| `footer.webp` | 1920 × 480, target ≤180 KB | Low village/book skyline and greenery, clear upper area for overlay |
| `popup.webp` | 960 × 720, target ≤160 KB | Soft festive interior/greenery behind a solid readable popup card |
| `logo-christmas.webp` | Around 800 × 204, target ≤100 KB | Transparent seasonal adaptation of the original logo; legible at 180px header width |
| Seven character WebPs | Around 640 × 585 each, target ≤85 KB each | Full cutout silhouettes, matching lighting/style, clean alpha edges |

Total planned generated assets: **12** (four scene images, one logo, seven characters). Keep the total delivered pack around 1.7 MB or less, but load only needed assets: responsive hero selection, lazy lower-page characters, and no Christmas media downloads when Christmas is inactive. Size limits are delivery budgets, not promises about a generator's output.

Optional later assets: social sharing art, festive section dividers and a dedicated New Year preset. They are outside the first implementation. No new raster images are needed for procedural snow, glow or the optional vector sleigh.

### Generation briefs

**Shared art direction:** polished friendly 3D storybook illustration for Smart Labs English learning; deep evergreen, midnight blue, ivory, warm gold and restrained cranberry; premium soft lighting; no text/watermarks, no frightening imagery.

**Desktop hero:** a cosy festive study room, elegant tree with warm lights, closed study books, subtle garland, window overlooking a softly lit village; illustration concentrated on the right; quiet dark left copy space; no people, no logo or lettering. Request the mobile view separately with portrait-safe composition.

**Character prompt template:** one {character description}, complete full body and accessories, matching the approved Christmas hero style, closed study book or learning prop, generous transparent margin, genuinely transparent background, no scenery/floor/backdrop, no text/logo/watermark. Generate separately so each character can be placed and controlled independently.

**Logo brief:** use the original Smart Labs logo as the edit reference; preserve exact SMART/LABS lettering, A triangle/dot and rules; warm ivory/gold with a small cranberry Santa hat and tiny holly detail; crisp small-size readability, no obscured letters, transparent background, minimal padding. Never overwrite the original logo or Halloween version.

Record each final prompt, generation source, selected master, optimisation and visual review in a new `docs/christmas-image-production.md` when production begins. Inspect transparent outputs on both light and dark backgrounds.

## 7. Technical work required before adding the preset

The current system has a Halloween-specific draft (`seasonalThemeDrafts/halloween`), a single runtime configuration (`seasonalThemeRuntime/current`), Halloween asset validation, copy, CSS attributes, popup identity and synthesised audio labels. Adding only a dropdown or Christmas files will not support two independent yearly campaigns.

1. Add a shared preset registry with stable IDs `halloween` and `christmas`. Each defines defaults, labels, asset catalogue, companion scenes and permitted effects. Keep shared schedule, route and contrast logic.
2. Version the configuration schema and add a theme ID. Parse older ID-less configurations as Halloween, preserving their exact mode, schedule, media, revisions and prior effects. Unknown IDs fail safely to standard appearance; do not silently interpret them as Christmas.
3. Keep separate draft documents and separately published preset records. Retain `seasonalThemeRuntime/current` as one atomically versioned public manifest containing both published schedules, explicit priorities and a global suppression flag. Drafts stay out of it. A selected-theme publish updates only its entry in a transaction with revision checks.
4. Make the public resolver choose one effective preset from the manifest using trusted server time. Preserve the existing refresh lease and safe fallback on stale/unavailable reads. Return only public settings; never return drafts or editor details.
5. Migrate a legacy `current.config` manifest to a Halloween entry with no visual or activation changes. Preserve historical records; tag legacy history as Halloween on read. Back up first, make migration idempotent, and verify old/new resolvers agree before changing the runtime format.
6. Make authenticated save/publish/preview/history/upload endpoints validate theme ID and isolate the selected theme. Scope preview records and restores by ID; reject cross-theme asset/version restores. Preserve admin/developer-only access.
7. Refactor hard-coded Halloween palette/media/copy to the active preset. Keep shared CSS tokens and cleanup; separate Halloween bats/embers from Christmas snow/glow/sleigh. Do not allow a theme switch to leave the prior season's styles, timers or layers behind.
8. Keep existing visitor standard-appearance and pause choices across all seasons. Namespace popup dismissal and any per-season audio choice by theme/occurrence; no autoplay after switching themes.
9. Extend bundled/CDN allowlists narrowly for Christmas. Keep all existing upload type/size/host checks and original content stores unchanged. No new paid provider, dependency or cron job is needed for the core feature.

Primary areas: `src/lib/seasonal-theme/config.ts`, `server.ts`, seasonal API routes, admin seasonal panel, `src/components/seasonal/`, `src/app/seasonal.css`, asset paths and focused scripts. Root layout/header/footer integrations should remain shared rather than duplicating Christmas versions of the pages. The separate mobile app remains outside this website plan.

## 8. Safe implementation sequence

1. Capture current standard and Halloween desktop/mobile baselines; preserve unrelated working-tree edits and live runtime configuration.
2. Refactor the shared preset/schema/resolver architecture with Halloween as the only registered active implementation first. Verify no behaviour change before adding Christmas.
3. Generate and inspect the 12 Christmas assets; optimise delivery files and preserve masters/prompts.
4. Add Christmas preset, theme library and independent admin drafts/schedules. Keep Christmas unpublished and Off.
5. Add shared placement adapters, Christmas logo, snow/glow/hero motion and optional sleigh; keep audio/popup off.
6. Verify private draft previews, contrast, responsive layout, protected routes, theme switching, annual schedules, authorization and rollback.
7. Review a concrete Christmas preview and configure the intended annual window through the panel. Publishing/activation is a separate administrator action; this planning task does not change live settings.

## 9. Acceptance and regression checks

- Standard appearance matches the baseline after either theme ends, is disabled, or is declined by a visitor; original logo, content and light/dark preference restore.
- Existing Halloween schedules, assets, hero effects, bat scopes and admin controls still behave as before.
- Both annual presets remain published independently; December activation does not require re-publishing Halloween next October.
- Verify 30 November/1 December and 31 December/1 January boundaries for 2026–2027 and later years, exclusions by start year, manual expiry and schedule conflicts.
- A December campaign's identity remains stable through its January tail; popup identity changes next occurrence and differs from Halloween.
- Private drafts and previews do not leak; anonymous/student/teacher cannot publish or upload; wrong-theme version restores and stale revisions fail safely.
- Global Off, selected-theme Off, expired leases, disconnect/reconnect and open-tab boundaries have predictable tested outcomes; one theme's Off does not silently disarm another.
- No mixed-season styling, ornaments, sound or lingering animation state after Halloween → Christmas → standard transitions, including client-side navigation.
- Verify homepage, courses, contact, public registrations, menus/dialog portals and representative protected routes at 360px, 390px, tablet and desktop widths.
- Text, card gradients, status colours, placeholders, hover/focus states and gold-button labels remain readable. Keep accessible focus, popup Escape/focus return and clear contrast fallbacks.
- Pause and hidden-tab handling stop every animation/audio source. Reduced motion removes snow/sleigh/background movement. No audible autoplay or interference with educational media.
- Effects do not block clicks or cause horizontal overflow. Inactive Christmas assets do not load. Compare page load, scroll and interaction performance against baseline; lower density if needed.
- Run the existing seasonal test suites, new multi-preset/migration/Christmas tests, TypeScript and production build. Record current project warnings separately. Verify the Electron wrapper's spacing and controls before claiming wrapper coverage.

## 10. Resources and deliverables

Reuse the installed Next.js/React/Tailwind stack, existing Firebase Admin role checks, shared seasonal calendar, preview mechanism, contrast helper, visitor controls and Bunny upload integration. Do not create a second credential or expose service-account material. Bundled assets must work without custom-upload configuration.

Resources needed for implementation: original logo, generated Christmas pack, approved seasonal copy, a safe staging Firebase/CDN setup for migration/publishing/upload checks, accounts for role tests, desktop/mobile baselines and an audio output device for opt-in sound testing. Existing local credentials do not by themselves establish staging safety. No paid stock assets are required for the proposed first version.

Planned deliverables: reusable Christmas preset and admin controls; independent seasonal schedules; 12 optimised images with masters/prompts; original procedural effects; regression tests; `christmas-image-production.md`; Christmas operations notes and desktop/mobile preview captures. This file is the planning deliverable only.
