# Halloween theme — implementation and admin guide

Updated 18 October 2026. The feature defaults to **Off**. No live settings have been published by this update.

## Open the controls

Sign in as an `admin` or `developer`, open Admin Dashboard → System → **Seasonal Themes**, or visit `/admin/dashboard/seasonal-themes` on your website. Teachers and students cannot manage this feature.

The nine tabs cover Overview, Schedule, Appearance, Hero & footer, Motion & sound, Popup, Pages & devices, Assets, and Preview & history. Save Draft preserves your work without affecting visitors. Publish Settings makes that configuration available to visitors. Draft and published settings are separate.

## First use

1. Leave the mode Off while customising the design.
2. Use the bundled desktop hero, mobile crop and footer panorama, or upload replacements. The seven-character collection offers Ghost scholar, Wizard owl, Witch kitten, Book bat, Pumpkin robot, Witch fox and Mummy bunny. Choose one under Hero & footer, Popup or Assets; it is used by the hero and seasonal popup after publication.
3. Adjust the headline, greeting, description, CTA labels/internal destinations, overlay and character placement under Hero & footer.
4. Choose public-page colours. The panel shows text/background, text/card and button contrast; publish rejects combinations below 4.5:1.
5. Use Preview Draft. It creates an authenticated, five-minute preview, forcing the theme on eligible pages without changing published mode. Select different page/viewports and refresh the preview. Normal visitors cannot activate it with a query string.
6. Choose Automatic Schedule or Manual On, then Publish Settings. Automatic defaults to 25 October at 00:00 through 1 November at 00:00, Sri Lanka time. Manual requires a future expiry and stops after that expiry.

The controls report which configuration is published. Unsaved edits are marked. If another admin has changed the draft, reload rather than overwrite their revision.

## Every year

Leave **Repeat every year** enabled and publish Automatic Schedule. At the configured end time the regular appearance returns without deleting media or content. Next year's occurrence uses the saved approved assets. Skip individual years if desired.

Use evergreen popup copy for recurrence. If a popup contains a dated promotion, set its separate expiry in Popup → Promotion expiry so it cannot reappear next year. The theme itself can remain active after a popup expires.

## Stop immediately

Select **Restore standard theme**. This publishes Off and also disarms the draft. It removes the seasonal palette, homepage hero, footer artwork, popup, animation and sound; the underlying current website becomes visible again. It preserves seasonal assets and version history.

Open online pages normally refresh configuration every ten seconds. There can be request latency. Pages with an unavailable connection fall back to the standard theme when their sixty-second validity lease expires. A known calendar end is also checked with a local boundary timer; it does not depend on a scheduled job.

To restart after an emergency stop, explicitly select Automatic or Manual and publish again. Restoring an old version creates a draft only; it never automatically reactivates the public theme.

## Visitor controls and protected pages

Eligible visitors can select Standard appearance, pause effects, or explicitly enable sound on the homepage when the admin offers it. Sound is intentionally limited to the homepage so it cannot compete with embedded video pages. Standard appearance and pause preference are remembered. All visits start silent; sound never autoplays. Leaving the homepage, hidden tabs and other playing website media stop ambience, which stays stopped until the visitor requests it again. Character animation pauses when the hero is offscreen.

Speaking/listening/mock tests, practice tools, student dashboards, admin, developer console, payment/enrolment, account access, partner portal, QR welcome and site-status pages are excluded in shared code. They do not request seasonal settings. Additional route exclusions and a Homepage Only option are available. The separate Expo mobile app is not changed.

The theme does not alter course data, pricing, scoring, payments, forms, real reviews or existing homepage content documents. Existing event/workshop/webinar popup logic is preserved. Halloween yields to another visible overlay; if one is open at its scheduled moment, Halloween skips its attempt for that page mount. It does not reorder the existing promotions.

## Assets and sound

| Public asset | Size | Use |
|---|---:|---|
| `/seasonal/halloween/hero.webp` | 120,886 bytes | Desktop hero and default popup background |
| `/seasonal/halloween/hero-mobile.webp` | 89,892 bytes | Responsive mobile crop |
| `/seasonal/halloween/ghost.webp` | 61,566 bytes | True alpha ghost scholar with pumpkin/books |
| `/seasonal/halloween/wizard-owl.webp` | 55,512 bytes | True alpha owl scholar in a wizard hat |
| `/seasonal/halloween/witch-cat.webp` | 67,340 bytes | True alpha witch kitten with pumpkin/book |
| `/seasonal/halloween/book-bat.webp` | 46,790 bytes | True alpha lavender bat with study book |
| `/seasonal/halloween/pumpkin-robot.webp` | 53,290 bytes | True alpha smiling pumpkin learning robot |
| `/seasonal/halloween/witch-fox.webp` | 60,936 bytes | True alpha orange fox with witch hat/book |
| `/seasonal/halloween/mummy-bunny.webp` | 52,788 bytes | True alpha friendly bunny in an ivory mummy costume |
| `/seasonal/halloween/footer.webp` | 72,290 bytes | Footer panorama |

These images were made with the built-in image generation tool. The production prompt set and original PNG masters are recorded with this update. Generated originals should be kept outside `public` where possible; served images use optimised WebP. No paid image library or new runtime package is required.

Upload supports PNG, JPEG, WebP, MP3 and Ogg, up to 3 MB. The separate endpoint verifies admin/developer access, basic file signatures, MIME type and size, generates immutable UUID keys, and uses the existing Bunny connection. Unsupported formats are rejected. Uploaded media URLs are limited to the configured CDN's seasonal directory when previewing or publishing. A failed upload never replaces a configured asset. Uploads are not a full searchable digital-asset-management system; their selected URLs are retained in the draft and published version history.

Sound defaults to original, quiet synthesized ambience using browser Web Audio. No recording is downloaded in this mode. An admin can upload an owned/licensed ambient recording instead. The visitor still has to click Enable Halloween Sound. Uploading a recording is the admin's choice; no third-party audio has been purchased or sourced.

## Configuration and deployment

The server requires the project's existing `FIREBASE_ADMIN_CONFIG`; Firebase client sign-in must also be configured as it is for the other admin features. The user-supplied Downloads service-account file was verified against project `smart-labs-ekk8j` and configured in the git-ignored local `.env.local`. A read-only Firestore check succeeded and confirmed that no seasonal runtime document had been published. The original Downloads file was left unchanged. Do not paste private keys in chat or put them in public environment variables.

Custom uploads additionally require the existing `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_HOSTNAME` and `NEXT_PUBLIC_BUNNY_HOSTNAME`. The bundled assets work without Bunny. Follow the existing upload integration's hostname format; the seasonal integration accepts a bare CDN hostname or an HTTPS base.

New Firestore collections are server-managed: `seasonalThemeDrafts`, `seasonalThemeRuntime`, `seasonalThemeVersions`, `seasonalThemePreviews`. Existing default-deny client rules remain appropriate: public readers use a minimal server endpoint, and writes go through authenticated server endpoints. This implementation does not change deployed rules, add cron jobs, change site-mode settings, or create a production Firestore document during installation.

The runtime intentionally applies the optional theme on the client so the existing static initial rendering and root layout architecture remain intact. The first paint can show the standard theme briefly while settings load. This differs from the plan's proposed initial server-rendered seasonal state; removing that brief transition would need a separately measured rendering/cache change.

## Verification and limits

Run `node scripts/test-seasonal-theme.cjs` and `node scripts/test-seasonal-publishing.cjs`. The first exercises the actual schema/calendar/route-policy module. The second uses the actual publishing handler and authorization helper with isolated in-memory infrastructure; no real Firestore data is written.

The read-only visual fixture in `scripts/preview-seasonal-theme.cjs` renders actual hero/admin markup with synthetic state and no database connection. It is a separate loopback-only server, not a Next.js route or an authentication bypass. Its form buttons are inert. To use it, generate styles with `node node_modules/tailwindcss/lib/cli.js -i src/app/globals.css -o tmp/seasonal-visual.css --minify`, then run `node scripts/preview-seasonal-theme.cjs` and open `http://localhost:9014/`. Never treat the fixture as proof of real account publishing.

Saved visual references: `halloween-hero-preview.png`, `halloween-mobile-preview.png`, `halloween-admin-preview.png`. The admin screenshot uses synthetic data; the actual local homepage was also inspected with the feature Off.

The original feature passed 20 focused tests and a production build, including TypeScript checking and all 332 static pages. The character expansion passes 21 tests (12 schema/calendar/route tests and 9 authorization/publishing tests), including validation of every bundled character and rejection of unknown local media paths. TypeScript and generated styles are checked again for the expansion. Existing dependency/Tailwind warnings remain; build-time lint is disabled by the existing project configuration. Against the original built local server, the public runtime returned HTTP 200 with mode Off and private/no-store caching. Unauthenticated admin GET/POST and an invalid token all returned HTTP 401. The real Firebase connection was used for the read-only runtime check.

Live signed-in publishing, real custom uploads, all-route active-theme visual review, audio-device behaviour and Electron integration still require an administrator staging session. This checkout initially lacked Firebase Admin configuration; that connection is now locally configured and verified. No real Firebase documents were created or edited for testing. Custom upload testing also requires the existing Bunny storage settings. Complete those checks before seasonal activation on production.

Future enhancements from the larger design plan include per-section advanced styling, arbitrary timezone/DST support, separate popup audience schedules, multiple character slots, richer asset metadata/search, and a shared coordinator that reorganises all existing promotions. They are not required for the implemented off/annual/manual switching system and are not silently enabled.
