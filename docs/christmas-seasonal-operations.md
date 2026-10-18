# Christmas seasonal theme — operations

Implemented 18 October 2026. The Christmas preset is **Christmas Learning Village**. The same seven Smart Labs companions have separate Christmas editions: ghost scholar, owl, kitten, book bat, pumpkin-headed robot, fox and bunny. The robot retains its familiar pumpkin head; the bunny wears a festive sweater rather than mummy wrapping. Halloween artwork remains unchanged.

## Admin workflow

Open `/admin/dashboard/seasonal-themes` and select **Christmas** in **Season library**. Save unsaved edits before changing presets. Halloween and Christmas have independent drafts, images, published schedules and history.

1. Keep mode Off while editing. Review Appearance, Hero & footer, character placements, Motion & sound, Pages & devices and Popup.
2. Choose Automatic for yearly activation. The Christmas default window is **1 December 00:00 through 1 January 00:00, Asia/Colombo**; start inclusive, end exclusive. The 2026 occurrence ends on 1 January 2027. Excluded years refer to the occurrence's start year.
3. Save draft. Use Preview draft for a private five-minute preview, including while mode is Off. Inspect desktop and mobile, then publish when ready.
4. **Disable Christmas** disarms Christmas's published settings and draft while preserving Halloween. **Restore standard — all seasons** disarms both published schedules and both drafts, including from a stale panel. Re-enable a season by choosing Automatic or Manual and publishing again. Manual requires a future expiry.

The library shows published mode for each season and the effective appearance now. When published dates overlap, a currently valid Manual configuration wins, then higher conflict priority, then stable theme ID. Default priorities are Halloween 10 and Christmas 20. One appearance is selected, never a combination of both themes. Priority is editable under Schedule.

Changing, publishing, previewing or disabling one preset does not overwrite the other. Restoring an old version changes only the selected draft. Cross-theme media and version restores are rejected. Older Halloween configurations without a theme ID are interpreted as Halloween and retain their mode, dates and media.

## Visual and motion controls

- Christmas logo in header/footer; original branding returns with standard appearance or on image-load failure.
- Separate desktop/mobile hero, footer and popup artwork; familiar existing course links and content remain.
- All seven Christmas companions distributed across three homepage scenes and the footer. Other eligible public pages receive small rotating pairs. Every placement and mobile character visibility can be switched separately.
- Slow hero background drift, floating warm lights and soft gold glow. Hero motion pauses when its section is offscreen.
- Snowfall: Off, hero only, homepage screen or eligible public website pages. Low uses 12 flakes; Medium uses 24. Optional sleigh is an occasional homepage-hero pass and starts disabled.
- Mobile effects start disabled. Opt-in mobile motion shows at most six flakes. The character artwork remains static on mobile as before.
- Animation master, visitor Pause effects and hidden-tab state pause all seasonal animation, including the glow pseudo-element. Reduced-motion CSS removes snow/sleigh/glow and keeps the background still. Decorations cannot intercept clicks; screen effects sit below navigation/dialogs.
- Sound and popup start disabled. Sound is opt-in, homepage-only and silent on load; the bundled option is the existing original synthesized ambience. Owned/licensed recordings can be uploaded. Other website media takes priority.

Protected learning, account, payment, assessment and admin routes remain excluded by the existing route policy. Page exclusions and Homepage-only settings also apply. Visitor standard-appearance and pause preferences continue across seasons. Popup dismissals are scoped to season and yearly occurrence; a Halloween dismissal does not suppress Christmas.

## Data and backwards compatibility

The existing Firestore runtime document remains `seasonalThemeRuntime/current`. Version 2 stores a `themes` map with independently published Halloween/Christmas entries and an update timestamp. Each entry contains public config, version and published timestamp. The top-level legacy `config/version/publishedAt` projection continues to represent Halloween so older clients are not suddenly given Christmas assets they cannot render.

Reads accept the previous single-config runtime and do not write a migration. The next authorized publish or restore builds the versioned manifest transactionally, preserving the other published season. Draft revision checks still reject stale edits. Global restore reads both drafts before writing and disarms both within one transaction.

Drafts: `seasonalThemeDrafts/halloween` and `seasonalThemeDrafts/christmas`. Halloween's existing `seasonalThemeVersions` collection stays intact. Christmas history uses `seasonalThemeVersionsChristmas`, so querying one season never pushes another season's history out of a bounded result set; no new composite index is needed. Preview records use `seasonalThemePreviews/{adminUid}-{themeId}`, with the existing HttpOnly five-minute cookie and role recheck. They do not publish settings.

The public endpoint supplies validated published candidate configurations and server time; the client resolves transitions using server-relative time, including already-open pages. The existing refresh/lease fallback remains. Public responses contain no editor identities, drafts or history. Only admin/developer server endpoints can save, publish, upload or restore. Existing default-deny client rules remain appropriate for the server-managed collections.

Christmas uploads use `images/seasonal/christmas/` on the existing configured Bunny CDN and the same restricted upload endpoint. Halloween uploads keep their existing path. Bundled media requires no custom-upload settings. No new provider, credential, dependency or cron job was introduced.

## Assets and verification

Delivered media: 12 WebPs, **1,199,516 bytes total**. The browser selects one responsive hero and lazy-loads lower-page character images. Inactive presets do not render or request their artwork. Masters and exact prompts are in `docs/seasonal-asset-sources/christmas/`; see `christmas-image-production.md` for dimensions and provenance.

Focused suites: `test-seasonal-theme.cjs` (14), `test-seasonal-publishing.cjs` (13), `test-seasonal-contrast.cjs` (6), `test-seasonal-flight.cjs` (4), `test-christmas-theme.cjs` (7), `test-seasonal-runtime.cjs` (4): **48 tests pass**. Tests use isolated in-memory infrastructure; none writes real Firestore data. They cover legacy data, independent publication, authorization, preview separation/expiry, cross-theme rejection, emergency restore, year boundaries, exclusions, overlap priority, protected routes and bounded effect rendering. TypeScript and the production build pass, including all 332 static pages. Existing dependency/Tailwind warnings remain; the project's existing configuration skips build-time lint.

The loopback-only read-only fixture can be launched in PowerShell with `$env:SEASONAL_FIXTURE_THEME='christmas'; node scripts/preview-seasonal-theme.cjs` after generating styles as documented for Halloween. It renders real seasonal component/admin markup using synthetic state and strips application scripts from captured public SSR layouts. Its page captures use an Arial fallback while production font files may be rebuilding; the application font configuration is unchanged. It is not an authentication bypass or proof of live publishing. Saved captures: `christmas-homepage-preview.png`, `christmas-mobile-preview.png`, `christmas-admin-preview.png`, `christmas-characters-preview.png`.

Browser preview checks: homepage (250 text nodes), Courses (88), Contact (61), PTE registration (35) passed the composed-colour audit. All seven Christmas source paths were present in homepage placements, both Christmas logos loaded, and no flying Halloween bats appeared. Switching to standard removed compatibility attributes and restored original logo sources. Snow/scene/glow/sleigh pause was inspected; default mobile motion was hidden and opt-in mobile snow capped at six flakes without horizontal overflow at 390px. These checks are representative, not an exhaustive accessibility audit of every page/state/widget.

Remaining staging checks: live signed-in publish/restore with two administrators, real Bunny uploads, device audio, browser reduced-motion preference switching, Electron spacing, and an all-route interactive visual review. No live theme configuration was changed during implementation. The supplied credentials remain outside version control.
