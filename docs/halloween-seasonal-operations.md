# Halloween theme — implementation and admin guide

The manager now also supports Christmas. Select Halloween in the shared Season library to edit this preset. **Disable Halloween** affects Halloween only; **Restore standard — all seasons** disarms both annual schedules and drafts. Existing Halloween settings/history and media are preserved. See `christmas-seasonal-operations.md` for the versioned runtime manifest, independent previews and multi-season workflow.

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

## Distributed characters, readable colours and seasonal logo

The admin panel now includes Characters around the website controls for three homepage scenes, public page introductions/endings, the full seven-character footer cast, and mobile visibility. These follow the existing character master switch, route exclusions, animation/pause settings and annual/manual activation. The hero/popup character picker remains independent. Protected account and admin routes stay excluded.

Hero & footer and Assets also include a Halloween logo switch. The transparent bundled logo appears in the enabled header/footer areas, with the original logo restored when disabled or when the theme ends. The original image file is untouched; failed seasonal image loads fall back to it.

Seasonal palette compatibility adapts neutral paper cards and gradients, then measures text against composed solid/gradient surfaces. It preserves readable dark labels on bright buttons and corrects failing text only while the relevant theme area is active. Cleanup removes its private attributes and CSS variables. Hero/footer photo overlays are strengthened separately. This does not constitute an exhaustive accessibility audit of every image, interactive state or third-party widget.

Validation: 28 focused tests pass (13 configuration/calendar/route, 9 publishing/authentication, 6 colour compatibility), TypeScript checking passes, and the production build succeeds with all 332 static pages. Existing dependency/Tailwind warnings remain. A read-only actual-markup fixture checked 250 homepage, 88 Courses, 61 Contact and 35 PTE registration text nodes with no remaining failures in its composed-colour audit. Mobile at 390px showed no horizontal overflow; both logos loaded. Switching the fixture back removed all contrast/surface adjustments and restored both original logo sources. Saved visual reference: `halloween-readable-homepage.png`. These previews do not test authenticated forms or live publishing. No live seasonal configuration was changed during this work.

Future enhancements include arbitrary timezone/DST support, separate popup audience schedules, richer asset metadata/search, and a shared coordinator for existing promotions.

## Animated hero and flying bats

Under Motion & sound → Animated hero & flying bats, independently enable the hero background/embers and flying bats. Choose Homepage hero only (default), Across the homepage screen, or Across eligible public website pages. All scopes inherit activation dates, route exclusions, protected-route restrictions and the animation master switch. Screen-wide bats are fixed to the viewport and cannot intercept clicks; header, appearance controls and dialogs retain priority. Hero-only bats stop when the hero is offscreen.

The hero uses a slow 28-second background drift and five soft floating embers. Original vector bats have flapping wings and staggered flight paths: Low uses three, Medium six. No extra image download or animation library is needed. Mobile effects start disabled; optional mobile motion limits visible bats to two. Reduced-motion CSS hides flying bats/embers and keeps the hero background still. Pause effects and hidden-tab state freeze background, ember, wing and flight animations. Standard appearance removes the seasonal components.

Existing saved configurations gain hero-only effects without altering their activation mode or media. Draft changes require Publish settings as before. No live settings were changed while implementing this addition.

Verification: 33 focused tests pass, including four actual flight-component render tests and migration/scope validation. TypeScript and the production build pass, including all 332 static pages; existing dependency/Tailwind warnings remain. The read-only fixture verified animated flight/wing transforms, hero background motion, pointer-events:none, all 15 motion elements paused by the preview control, and running state after resume. At 390px the default motion layer is hidden and background static; optional mobile screen effects show two bats without horizontal overflow. Admin control markup was reviewed using synthetic state. Saved still reference: `halloween-animated-hero-preview.png`.
