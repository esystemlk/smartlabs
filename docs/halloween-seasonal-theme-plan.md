# Smart Labs Halloween seasonal theme — implementation plan

Prepared: 18 October 2026. This is the original planning snapshot. Implementation has since started: see `halloween-seasonal-operations.md` for delivered controls, verification and remaining staging checks, and `halloween-image-production.md` for generated artwork. The full roadmap below also includes later enhancements.

## 1. Intended result

Add a reusable Halloween theme that admins can preview, publish, schedule every year, adjust by section, and disable immediately. Turning it off restores the existing Smart Labs visuals, content, interactions, and visitor light/dark preference. Seasonal media stays in the asset library for next year.

Recommended direction: “Enchanted Learning Lab.” Friendly pumpkins, a ghost carrying a book, a small wizard owl, moonlight, and restrained orange/violet accents. Keep Smart Labs recognisable and course information easy to read. Use polished illustrated characters rather than frightening imagery. No jump scares, flashing effects, or sudden loud audio.

The system covers the whole website through shared tokens and explicit page adapters. Public marketing pages get the full experience. Account and student screens get optional restrained styling. Tests, recording, listening, payment, and admin screens have protected defaults described below. The separate Expo mobile app in `smartlabs-app/` is outside this website update; the Electron website wrapper needs verification.

## 2. Findings from the folder

| Existing area | What it means for this update |
|---|---|
| `package.json`: Next.js 15, React, Tailwind, Firebase, Framer Motion, Radix, Zod | Reuse the installed UI, validation, and animation libraries. |
| `src/app/layout.tsx` | Shared provider integration point around header, main content, footer, and overlays. |
| `src/app/globals.css` | Existing light/dark CSS variables support a seasonal token layer. |
| `src/app/page.tsx` | Homepage includes separate responsive hero markup and many fixed white/slate/blue classes; a variable override alone will not theme it fully. |
| `src/components/layout/header.tsx`, `footer.tsx`, `layout-manager.tsx` | Existing route exclusions and desktop-wrapper spacing must be preserved. |
| `src/components/layout/layout-extras.tsx` | Existing deferred widgets and popup delay should be reused. |
| `src/components/events/event-popup.tsx`, `workshop-popup.tsx`, webinar widgets | Multiple promotional surfaces need a shared popup priority policy. |
| `src/lib/services/homepage-content.service.ts`, `src/hooks/use-homepage-content.ts` | Existing homepage content uses Firestore; seasonal overrides should be separate from these records. |
| `src/app/admin/dashboard/page.tsx` | Add a “Seasonal Themes” entry to the existing dashboard. |
| `src/app/api/admin/site-mode/route.ts` | Existing server token/role checking is a useful pattern; seasonal access is admin/developer, independent of the developer-only site kill switch. |
| `src/app/api/upload/route.ts` | Existing uploads use Bunny storage; build a restricted seasonal media endpoint rather than assuming Firebase Storage is the media backend. |
| `firestore.rules`, `storage.rules` | Define explicit access rules for new documents; validate seasonal uploads on the server. |
| `vercel.json` | Scheduled jobs already exist, but theme activation should not depend on a daily job. |

There are existing uncommitted changes in this folder. Implementation must preserve them and review the current header/dashboard changes before integrating.

## 3. Visual coverage and page behaviour

| Surface | Halloween treatment | Admin options |
|---|---|---|
| Global public theme | Midnight/plum surfaces, warm ivory text, orange CTA, violet highlights, subtle borders | Preset, light/dark seasonal variant, intensity, approved palette values |
| Header/navigation | Small pumpkin/book accent beside original logo, seasonal nav borders, optional announcement bar | Accent toggle, bar text/link, sticky behaviour, mobile visibility |
| Homepage desktop hero | Wide moonlit learning-lab illustration, clear space behind headline, book ghost on opposite side | Background, overlay opacity, focal point, character, placement, headline/subtitle override, existing CTA targets |
| Homepage mobile hero | Separate portrait crop, smaller character, static background | Mobile image, crop, character visibility and scale |
| Homepage lower sections | Coordinated card surfaces, borders, section dividers, occasional corner accents | Section toggles, divider choice; retain real course/review/stat data |
| Footer | Low skyline of pumpkins/books, moonlit gradient, small owl near outer edge | Background, opacity, character, mobile simplified mode |
| Seasonal popup | Friendly cutout character overlapping a readable card; optional background illustration | Copy, image, CTA, delay, frequency, audience, route targeting, schedule |
| Courses, registrations, workshops, webinar, blog, resources, contact and other public routes | Shared colours plus optional heading ornament | Route groups, heading ornament, page exceptions |
| Login/signup/account/student dashboard | Restrained accent colours; decorations opt-in | Independently enable shell colours; no popups/audio by default |
| Speaking/listening/recording/practice/mock-test routes | Stable study interface | Decorations and seasonal audio always suppressed during active exercises; shell accents optional outside active tasks |
| Checkout/payment/status/QR welcome/developer console/admin | Existing functional appearance by default | Public payment and status surfaces remain free of seasonal overlays; admin gets preview controls only |

Before implementation completion, inventory every `src/app/**/page.tsx` route into these groups. Use one route-policy utility across header, footer, provider, popup, and sound. Exact matches and path-segment prefixes must avoid accidental matches such as `/courses-old`.

Suggested palette: midnight `#160F24`, plum surface `#261A38`, ivory `#FFF6E8`, pumpkin `#FF9A3D`, lavender `#C7A6FF`, muted text `#D0C4DB`. Treat these as design candidates; verify contrast for each actual text/background pair. Use dark text on orange buttons. Preserve distinct success/error/warning meanings.

## 4. Admin panel specification

New route: `/admin/dashboard/seasonal-themes` with a Halloween preset. All editable fields have labels, help text, validation, save/error feedback, and reset-to-preset actions.

### Persistent top bar

- Effective status: Off / Scheduled / Live / Preview, published version, last editor, last successful refresh, and next transition in Asia/Colombo plus UTC.
- Mode selector: Off, Automatic Schedule, Manual On. Manual On requires an expiry date so it cannot remain on accidentally.
- Actions: Save Draft, Preview, Publish, Restore Standard Theme, Version History.
- Show unsaved edits and a plain-language summary of what publishing will change. Draft saves never affect visitors.

### Tab A — Overview and activation

- Preset name, internal campaign name, description, year label, enable/disable.
- Effective-state explanation, for example: “Automatic schedule: starts 25 October 2026 at 00:00, ends 1 November 2026 at 00:00, Asia/Colombo.”
- Per-area master toggles: palette, header, homepage hero, section decoration, footer, popup, characters, animations, sounds.
- Standard-theme comparison and missing-asset/readiness checklist.
- Emergency “Restore Standard Theme” persists mode Off, stops audio, closes seasonal overlays, and cancels decoration animations. It does not delete drafts or assets.

### Tab B — Annual schedule

- Default proposal: 25 October 00:00 through 1 November 00:00, Asia/Colombo, recurring yearly. Dates are editable; no activation happens merely because this document exists.
- Controls: one-time or annual recurrence, start/end month/day/time, timezone, enabled years, excluded years, next three occurrence previews.
- Treat end as exclusive: active while start <= now < end. Annual recurrence uses local calendar dates, not a fixed number of UTC milliseconds.
- Define year-crossing seasons; assign the occurrence to its start year. Reject invalid dates, zero/negative windows, and unsupported ambiguous local times. Asia/Colombo is the initial supported timezone; expand timezone support with explicit DST rules if needed.
- A dated promotion inside the theme has its own expiry. Reusing a theme next year must not revive an old discount, event, or countdown.
- Off overrides recurrence until the admin re-arms Automatic Schedule. Manual On expires to Automatic Schedule only if explicitly selected; otherwise it expires to Off. Show that result beside the expiry field.

### Tab C — Colours and styling

- Seasonal preset, light/dark seasonal variants, button/background/card/text/border/accent colours, gradient intensity, corner decoration opacity.
- Contrast feedback, restore individual value, reset palette, before/after preview.
- Keep freeform CSS and executable markup out of the settings. Save bounded, typed values only.

### Tab D — Homepage and footer

- Desktop/mobile hero assets, fit mode, safe focal point, overlay opacity, character position/size, show/hide by viewport.
- Optional headline, subtitle, badge, button labels and internal links. Empty overrides inherit current content.
- Individual homepage section treatment toggles. Preserve reviews, data, course ordering, form state, and analytics identifiers.
- Footer art and character controls, section divider selection, optional greeting. Legal links remain readable and reachable.

### Tab E — Characters and animation

- Character asset picker, enabled placements, size, opacity, safe corner position, desktop/mobile visibility.
- Individual toggles: ghost bob, owl float, pumpkin glow, small bat flight, faint mist, slow background parallax.
- Intensity Off / Low / Medium; speed and density with bounded ranges. Default Low; mobile defaults to static art and one small optional character.
- Animation duration/session cap; pause when offscreen or the tab is hidden; global “Pause effects” visitor control.
- Respect reduced-motion and existing accessibility controls. Decorative layers ignore pointer events and are hidden from assistive technology.

### Tab F — Sound

- Master enable, ambient loop upload/picker, optional short popup cue, volume ceiling, loop/fade settings, route eligibility, mobile opt-in.
- Default published experience is silent. Show a clear “Enable Halloween sound” control; play only after an explicit visitor action. Admin enablement alone does not begin audible playback.
- Visitor mute and volume override admin defaults. Remember mute preference; do not unexpectedly restart on navigation. New visits do not autoplay sound.
- Stop immediately on route exclusion, theme expiry, hidden tab, or start of learning audio/microphone recording. Resume only when safe and consistent with visitor intent.
- Reuse a shared media-activity signal from practice players/recorders, not unreliable detection of DOM audio alone.
- Preview sound inside the admin panel without affecting visitors. Display file duration, size, and rights/source notes.

### Tab G — Popup and campaign copy

- Enabled, title/body, character/background, CTA label/internal destination, optional secondary action, start/end, audiences, routes, mobile visibility.
- Default: homepage/public marketing only, after 12 seconds, once per campaign occurrence, no sound. Delay must also respect existing popup readiness.
- Frequency choices: once per session, daily, once per yearly occurrence. Dismissal key includes campaign ID and occurrence year; revising copy alone does not reset it.
- Shared popup coordinator prevents seasonal, workshop, event, and webinar modal collisions. Explicit priority, one modal at a time, no immediate reopening after dismissal.
- Focus trap, Escape/close button, return focus, scroll lock, usable mobile height. Never block cookie/accessibility controls.

### Tab H — Pages, devices and visitor preferences

- Route-group switches, explicit allow/exclude rules, desktop/mobile presets, authenticated/anonymous audience selectors.
- Preview effective policy per route, including protected-route explanations. A more specific exclusion wins.
- Visitor controls: Standard appearance, Pause effects, Sound on/off. Persist across navigation; never let publishing override a visitor's accessibility or mute preference.

### Tab I — Asset library

- Upload/replace, preview on light/dark backgrounds, dimensions, alpha transparency indicator, file size, alt text/decorative status, focal point, usage references, provenance/rights notes.
- Publish validation checks required hero/mobile art and referenced assets. Optional failed decoration is skipped; required missing media blocks publication or uses an explicitly selected standard fallback.
- Versioned immutable URLs; archive instead of deleting in-use assets. Separate transparent character assets from opaque backgrounds.

### Tab J — Preview and history

- Desktop/mobile widths; homepage and selected route previews; silent-by-default sound audition; compare current standard and draft.
- “Simulate date” tests next year's schedule and expiry without changing production time.
- Preview uses an authenticated, short-lived session and draft version. Ordinary public query parameters cannot expose drafts or activate a theme.
- History lists editor, timestamp, changed fields, published revision. Restore creates a new draft; publishing it is a separate deliberate action.

## 5. Image and sound production manifest

Generate text-free art so actual headlines, dates, links, and offers stay editable HTML. Use one consistent illustrated style and lighting across the pack. Produce backgrounds and characters separately.

| ID / proposed file | Source size | Delivery / transparency | Placement and target budget |
|---|---|---|---|
| H01 `hero-desktop` | 2400 x 1350 | AVIF + WebP, opaque | Desktop hero; <= 300 KB preferred at served size |
| H02 `hero-mobile` | 1080 x 1440 | AVIF + WebP, opaque | Mobile art direction; <= 160 KB |
| H03 `footer-landscape` | 2400 x 600 | WebP, opaque | Footer skyline; <= 130 KB |
| H04 `popup-background` | 1200 x 900 | WebP, opaque | Optional popup card art; <= 120 KB |
| H05 `ghost-scholar` | 1024 x 1024 | Alpha PNG master + alpha WebP | Hero/popup cutout; <= 100 KB delivered |
| H06 `pumpkin-books` | 1024 x 1024 | Alpha PNG master + alpha WebP | Footer/section cutout; <= 100 KB |
| H07 `wizard-owl` | 1024 x 1024 | Alpha PNG master + alpha WebP | Hero/footer alternate; <= 100 KB |
| H08 `friendly-bat` | 512 x 512 | Alpha PNG master + alpha WebP | Small animated decoration; <= 30 KB |
| H09 `corner-web` | 768 x 768 | Alpha PNG master + alpha WebP | Optional corner ornament; <= 35 KB |
| H10 `section-divider` | 2400 x 220 | Alpha PNG master + alpha WebP | Sparse pumpkins/stars/books strip; <= 65 KB |
| H11 `seasonal-social` | 1200 x 630 | JPEG/WebP, opaque | Optional explicitly published social card, not required for launch |
| S01 `moonlit-lab-loop` | 30–45 seconds | MP3/AAC with tested browser fallback | Seamless quiet ambience; <= 600 KB, load only after opt-in |
| S02 `gentle-magic-cue` | <= 1 second | MP3 | Optional visitor-enabled cue; <= 30 KB |

Dimensions and byte sizes are production targets; inspect generated output and resize/compress rather than assuming generation returns exact dimensions. True transparent characters must have an alpha channel, with no checkerboard baked in. Keep clean edges and full silhouettes, including wings and hats.

### Ready-to-use generation briefs

Shared style prefix: “Premium friendly 3D storybook illustration for Smart Labs, an English-learning education brand. Enchanted learning laboratory at Halloween, rounded clean forms, warm pumpkin light, plum and lavender shadows, tasteful detail, welcoming students and families. No text, letters, logos, watermarks, gore, or frightening faces.”

- H01: Shared prefix + “Wide 16:9 hero background. Moonlit learning lab with books, a distant arched window and small pumpkins. Right third contains visual interest; left 55 percent is calm negative space for HTML headline and buttons. Gentle depth, readable dark gradient, no foreground character.”
- H02: Shared prefix + “Portrait mobile companion background, same laboratory and lighting as desktop. Detail concentrated in lower third, calm upper half for live website copy. No foreground character.”
- H03: Shared prefix + “Very wide low footer panorama, books and pumpkins along bottom edge, soft moonlit horizon, upper two thirds low detail for footer content.”
- H04: Shared prefix + “Landscape popup background, plum vignette with soft tiny stars and warm edge lighting; centre mostly empty for live title and CTA; no character.”
- H05: Shared prefix + “Single friendly floating ghost holding an open study book and small pencil, complete silhouette, front three-quarter view, true transparent background, no scenery or floor, generous clear margin.”
- H06: Shared prefix + “Single smiling glowing pumpkin beside a neat stack of learning books, complete isolated composition, true transparent background, no floor or scenery, generous margin.”
- H07: Shared prefix + “Single friendly owl wearing a small plum wizard hat and holding a closed study book, full body and wings visible, true transparent background, no scenery.”
- H08: Shared prefix + “Single tiny friendly lavender bat, rounded silhouette, fully visible spread wings, true transparent background, simple enough for small website decoration.”
- H09: Shared prefix + “Delicate decorative lavender spiderweb for a top corner, sparse clean threads, subtle warm star sparkles, true transparent background, no spider or scenery.”
- H10: Shared prefix + “Extremely wide shallow decorative divider of sparse tiny pumpkins, books and stars concentrated along the lower edge, generous transparent space, true transparent background.”
- H11: Shared prefix + “Wide social illustration using the same ghost scholar and pumpkin books, right-side composition, calm left space for separately added Smart Labs branding and editable campaign title.”

Generate H01/H02 first, then use their approved visual style as reference for the characters and footer. Use image generation for raster art; animate cutouts with CSS/Framer Motion rather than requiring animated video. Sound requires separately created or licensed recordings; image generation does not produce audio. Store provenance and licence with each sound. Do not use a track without reuse rights.

## 6. Technical design

### Reversible theme application

Use a seasonal scope attribute such as `data-seasonal-theme="halloween"` on eligible website containers. Layer CSS tokens over the existing theme. Removing the attribute restores the current stylesheet immediately; never overwrite the standard palette, homepage records, or original media.

Provide section adapters for fixed-colour markup, especially both homepage hero variants, registration cards, navigation menus, and footer. Do not perform blanket string replacements of Tailwind colour classes. Scope public portal content (dialogs, dropdowns, tooltips) consistently so it inherits the right theme without recolouring admin dialogs.

Keep `next-themes`/light-dark behaviour compatible where used; existing dependency presence does not establish a global provider. Inspect actual usage during implementation. Preserve visitor preference underneath the seasonal layer.

### Data model — proposed collections

- `seasonalThemeDrafts/{themeId}`: private editable draft; `schemaVersion`, revision, schedule, tokens, route policy, placement settings, media references, popup, audio, updatedBy/At.
- `seasonalThemeVersions/{versionId}`: private immutable full snapshot and editor metadata.
- `seasonalThemeRuntime/current`: minimal public published configuration, mode, version ID, schedule, expiry, route policy, validated asset URLs and display settings. No private editor data or preview secrets.
- `seasonalThemeAssets/{assetId}`: private catalogue with versions, storage key, dimensions, MIME type, bytes, transparency, rights notes, checksum, usages and archive state.
- `seasonalThemeAudit/{eventId}`: server-written publish/restore/mode/version actions; admin/developer read only.

Draft saves validate against a shared Zod schema. Publishing atomically writes the immutable version, public projection, and audit event in a Firestore transaction, checking the draft revision to prevent lost concurrent edits. Runtime reads never join private collections.

### Schedule and runtime resolution

Resolve in this order: emergency Off -> valid manual override -> automatic occurrence -> standard theme. Then apply route restrictions, visitor appearance preference, device rules, reduced motion, and media activity. A private preview replaces configuration only inside its authenticated session and still respects accessibility protections.

Evaluate schedule on the server for initial render using server time. Return `serverNow`, occurrence start/end, configuration version, and a bounded refresh deadline. Client tracks elapsed time from that anchor, re-evaluates on expiry, visibility change, and reconnect, and uses a public configuration subscription to receive mode/publish changes. Public time-sensitive responses must not be indefinitely cached. Preview responses are private/no-store; verify dynamic root rendering and server-query cost before choosing the final integration.

Schedule correctness must not rely on cron. A currently open tab removes effects at the known end boundary even offline. If configuration cannot be refreshed past a short validity lease (proposed 60 seconds), fail to the standard theme. A fresh initial read failure also gives standard theme. Online emergency disable target: within 10 seconds; validate actual subscription and hosting behaviour before launch. Offline clients cannot receive a new emergency command, so lease expiry provides the bounded fallback.

### APIs and access

Proposed endpoints: public `GET /api/seasonal-theme`; admin draft `GET/PUT /api/admin/seasonal-themes`; publish, mode, preview-session, history/restore, and asset upload endpoints beneath the admin prefix.

Verify Firebase bearer tokens and read the authoritative role on every admin request; only admin/developer can change the theme. Reuse suitable auth helpers after checking their allowed roles; the existing general staff uploader is broader than this requirement. Client route hiding is not authorization. Restrict direct Firestore client writes to seasonal documents; server Admin SDK writes perform validation.

Use restricted Bunny upload paths such as `images/seasonal/halloween/{assetId}/{version}.webp` and a separately supported audio location. Existing generic upload folders do not establish audio support. Validate actual file signatures, dimensions, size, MIME type, allowed extensions and generated storage keys. Reject executable/SVG/HTML uploads in this raster pipeline. Keep credentials server-only. Allow only approved CDN hosts and internal CTA paths; extend Next image configuration narrowly if necessary. Preserve unrelated storage and Firestore rules.

## 7. Proposed file changes

Paths below are proposed implementation files, not files already created by this plan.

| File/area | Responsibility |
|---|---|
| `src/lib/seasonal-theme/types.ts`, `schema.ts` | Configuration types, bounded values, defaults, migration version |
| `src/lib/seasonal-theme/schedule.ts`, `route-policy.ts` | Pure calendar resolver and route/device/media eligibility |
| `src/lib/seasonal-theme/server.ts` | Published config reads, trusted time, publish transactions and role checks |
| `src/components/seasonal/seasonal-theme-provider.tsx` | Runtime state, subscription, expiry, visitor preference and scope |
| `src/components/seasonal/seasonal-hero.tsx`, `seasonal-footer-art.tsx` | Responsive art adapters with standard fallbacks |
| `src/components/seasonal/seasonal-decorations.tsx` | Lazy decoration and motion lifecycle |
| `src/components/seasonal/seasonal-audio.tsx`, `visitor-controls.tsx` | Opt-in audio, pause/mute/standard appearance |
| `src/components/seasonal/seasonal-popup.tsx` | Accessible campaign surface |
| `src/components/events/popup-coordinator.tsx` | Shared priority/dismissal coordination with existing promos |
| `src/app/admin/dashboard/seasonal-themes/page.tsx` and admin subcomponents | Detailed tabs, drafts, validation, previews, history |
| `src/app/api/seasonal-theme/route.ts` and `src/app/api/admin/seasonal-themes/**/route.ts` | Public projection and authenticated admin operations |
| `src/app/seasonal-preview/page.tsx` | Private authenticated preview host; reuse production renderer |
| `src/app/seasonal.css` | Scoped palette, motion, reduced-motion and viewport rules |
| Existing `layout.tsx`, `globals.css`, homepage, header/footer, extras | Integrate provider, scopes and adapters without changing standard output |
| Existing admin dashboard, popup components, relevant players/recorders | Navigation, coordinator and media-activity integration |
| `firestore.rules`, CDN/image configuration as needed | Access and asset delivery; add Storage rules only if that backend is actually chosen |
| `public/seasonal/halloween/` or versioned Bunny keys | Optimised published assets; keep high-resolution masters separate |
| `docs/halloween-seasonal-operations.md` | Publish, yearly reuse, restore, and troubleshooting guide |

## 8. Performance, accessibility and resilience

- Only the selected responsive hero should load eagerly. Supply image dimensions/sizes and reserve layout space; avoid downloading both mobile and desktop hero images.
- Below-fold footer/decorations load lazily. No seasonal audio downloads before opt-in. Off mode must not request seasonal media.
- Use transforms/opacity, limit concurrent animated objects, avoid large continuously animated blur layers. Pause offscreen work and clean up all timers/listeners/audio on teardown.
- Target <= 500 KB additional initial mobile image transfer, no theme-caused layout shift, and no material regression from measured baseline load/interaction performance. Measure on an actual throttled mobile profile.
- Honour reduced motion and visitor opt-out, maintain readable contrast, keyboard navigation and visible focus. Decorative art cannot cover course CTAs, forms, menus, or footer links.
- Failed optional media disappears cleanly; failed required hero uses current standard art. A bad theme configuration or unavailable Firebase must not block navigation or payments.

## 9. Delivery sequence and effort

Indicative engineering effort for one developer, subject to route inventory and baseline checks: 9–14 working days plus asset review time. This is an estimate, not a delivery commitment.

1. Baseline and inventory (1 day): capture current desktop/mobile screenshots and performance, classify all routes, inspect existing in-progress changes and admin auth helpers.
2. Art pack and visual direction (1–2 days, plus review): generate first hero and cutout, establish consistency, produce remaining art, optimise and verify transparency; source/licence sound.
3. Runtime foundation (2 days): schema, resolver, scoped styling, public/private data, publish transaction, server initial state and fail-safe expiry.
4. Admin controls (2–3 days): full tabs, uploads, preview, annual calendar, validation, version history and emergency Off.
5. Website integration (2–3 days): both homepage layouts, global chrome, page adapters, popup coordinator, visitor controls, safe audio/media integration.
6. Verification and operations (1–3 days): schedule boundaries, permissions, route coverage, mobile/accessibility/performance checks, rollback runbook and staging review.

Suggested launch scope includes the whole public palette, hero/footer art, three primary cutouts, low-motion animations, popup control, opt-in ambience, complete scheduling and restore controls. Bats, web ornaments, optional social art and elaborate parallax can follow without delaying the core feature.

## 10. Acceptance checklist

- [ ] Off mode visually matches baseline across representative routes; original content and light/dark preference remain intact.
- [ ] Draft editing and private preview never affect public visitors; unpublished assets/settings stay private where required.
- [ ] Admin/developer can edit and publish; anonymous/student/teacher requests cannot publish, upload seasonal assets, or expose drafts.
- [ ] Invalid/oversized/mislabeled uploads and non-approved asset/link destinations are rejected.
- [ ] Concurrent edits produce a revision conflict instead of silently overwriting another admin.
- [ ] Automatic mode starts/ends at the correct Asia/Colombo instants in 2026 and 2027; occurrence skips and year-crossing windows behave as specified.
- [ ] Open tabs expire correctly; emergency Off, disconnect/lease expiry, wrong device clock, reconnect, and failed reads all have tested outcomes.
- [ ] Restore Standard Theme removes art, palette, popup, animations and audio without deployment or data deletion. Re-enabling next year reuses approved assets but not expired promotions.
- [ ] All route groups are inventoried and checked. Protected practice/payment/admin screens remain usable and free of disruptive seasonal effects.
- [ ] Desktop/mobile hero composition, footer, menus and portal dialogs work at 360 px mobile through wide desktop; art never covers functional content.
- [ ] Popup frequency resets for a new occurrence; dismissals, priorities, focus, Escape and existing event/workshop/webinar interactions work.
- [ ] No audible autoplay; mute persists; recording/listening starts stop ambience; excluded routes and hidden tabs stop sound.
- [ ] Reduced motion, visitor standard appearance, keyboard access and contrast checks pass.
- [ ] Transparent assets render cleanly on light/dark backgrounds; all required media has fallback and rights/provenance records.
- [ ] Schedule resolver and authorization/publish integration tests cover meaningful edge cases. Run repository typecheck and production build; establish a working lint command because the current script uses `next lint`.
- [ ] Compare mobile load/interaction and network transfer against baseline; verify Electron wrapper spacing and sound controls.

## 11. Resources and decisions

Already available in the codebase: shared layouts, Firebase client/admin integration, role records, existing admin UI patterns, Framer Motion, Radix dialogs, Zod, and a Bunny upload integration. Runtime credentials, deployed rules, CDN accessibility and hosting behaviour still need verification during implementation; their presence in source does not prove production readiness.

Needed for implementation: generated image pack, licensed or original audio, approved campaign copy if any, a staging Firebase/CDN environment or safe isolated draft data, test accounts for each role, and baseline desktop/mobile captures. Start with the recommended friendly direction, October 25–November 1 schedule, silent-by-default audio and protected learning routes; all configurable business preferences are specified in the panel above.

No paid asset purchases, production publishing, theme activation, code implementation, image generation or audio production has been performed as part of this planning deliverable.
