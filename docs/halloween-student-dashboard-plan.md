# Halloween for student dashboards

Status: implementation plan. This document does not activate a theme or change a published setting.

## Result

Give Student Home and the non-training PTE/IELTS dashboard pages a coordinated Halloween appearance with separate dashboard banners, backgrounds and checked text colours. Keep the existing website/admin scheduling controls, normal practice navigation, purchases, live credit balances and saved records working as they do today. Switching Halloween off restores the current dashboard artwork and colours immediately.

The student dashboard treatment is quieter than the public homepage: one illustrated banner, subtle background decoration, readable cards and a matching floating menu. No sound, promotional popups, page-wide bats, snow or characters crossing controls inside the student workspace.

## Page scope

Use an explicit allowlist. A path merely starting with `/dashboard` must never be enough to enable the theme.

| Page | Appearance |
| --- | --- |
| `/dashboard` | New welcome banner, Halloween workspace background, themed exam-choice frames, credits and record panels, floating dock |
| `/dashboard/pte` | Dedicated PTE Halloween hero and themed four-skill cards |
| `/dashboard/pte/speaking`, `/writing`, `/reading`, `/listening` | Theme the task-selection screen; stop when a task opens |
| `/dashboard/ielts` | Dedicated IELTS Halloween hero, readable Academic/General switch and skill cards |
| `/dashboard/ielts/listening`, `/reading`, `/writing`, `/speaking` | Theme the collection/selection view only; retain Coming soon labels |
| `/dashboard/ielts/mock-tests` | Theme the catalog frame and cards; starting an attempt leaves the seasonal scope |
| `/dashboard/registrations`, `/dashboard/results` | Seasonal outer background and headings; readable payment/score rows with their original status meanings |
| `/dashboard/settings`, `/dashboard/support`, `/dashboard/certificate-request` | Seasonal outer frame and small banner; forms, messages and document content stay on neutral reading surfaces |
| `/dashboard/guide` | Seasonal outer frame; guide article, screenshots and notes remain neutral and readable |

The abbreviated skill paths above mean the four exact paths underneath the stated exam prefix, not standalone `/writing` routes.

Always exclude all of the following, regardless of any admin-entered route or image setting:

- `/dashboard/practice/**`: every PTE trainer, question, response and scoring view.
- `/dashboard/ai-score-test/**` and nested `/dashboard/practice-tests/**`: legacy task/attempt routes; their index redirects continue to work normally.
- `/dashboard/ielts/{listening,reading,writing}/cambridge-*`: questions, timers, submissions, scoring and review pages.
- Every child of `/dashboard/ielts/mock-tests/`: mock attempts and their results/reviews.
- Standalone `/ai-essay-practice`, `/ai-ielts-essay-practice`, `/ai-sst-practice`, `/ai-wfd-practice`, `/swt-trainer`, `/mock/**`, `/mock-tests/**`, `/level-test` and their training/review variants.
- Recorded lessons, recordings, AI tutor/chat learning tools and future unknown dashboard routes until individually reviewed.
- Admin/partner portals, authentication, API, checkout, payment success/cancel, `/credits` and account-purchase pages.

The public `/mock-tests` catalog keeps its existing protected treatment in this update; no new public seasonal scope is introduced. Do not introduce class-joining or resource navigation.

## Architecture and restoration

Today, `src/lib/seasonal-theme/config.ts` deliberately protects the entire `/dashboard` prefix. Preserve that protection for the public theme. Do not delete it to obtain dashboard styling: that would also enable public effects on trainers and tests.

1. Add a separate dashboard configuration object to the existing seasonal schema. Its master switch defaults to **off** when reading older published documents. Keep existing public settings unchanged.
2. Add `src/lib/seasonal-theme/dashboard-routes.ts` with an exact allowlist and hard training exclusions. Unknown paths default to standard appearance. Existing administrator exclusions still win over the allowlist.
3. Extend `SeasonalThemeProvider` with a separate dashboard eligibility signal, based on its already validated server clock, selected season, annual schedule, manual expiry, private preview, mobile preference and Standard appearance preference. The current public `active` signal remains unchanged. Do not resolve dashboard activation independently with an untrusted browser clock or bypass the stale-manifest protection.
4. A new `DashboardSeasonalFrame` wraps the existing dashboard layout and applies `data-dashboard-seasonal="halloween"` only on eligible pages. Leaving a selection page for a trainer removes the frame's tokens, imagery and motion before the trainer is shown. Use the existing layout effect pattern to avoid a themed-frame flash in tests.
5. Put all overrides in a dashboard-specific stylesheet scoped to that attribute. Do not apply a body-level colour conversion or reuse the public blanket text replacement. Do not overwrite learner input, question formatting, timers, scoring/report markup or payment forms.
6. Replace the displayed hero/background through conditional render props or CSS variables. Retain the current `/images/student/*` defaults as the off-state fallback. Empty/broken seasonal asset URLs also fall back safely.
7. Keep this student dashboard feature independent from the public `homeOnly` scope. Reuse the same annual dates and manual/off mode; do not create competing seasonal timers. The global mobile master remains authoritative and its relationship to the dashboard mobile option is explained in the panel.
8. Reuse the existing private admin-preview authorization. A plain query parameter must not activate a draft for ordinary students. Scheduling, exclusion years, manual-until, Off and Standard appearance must all restore the original workspace without deleting records or requiring a page-specific reset.

## Admin panel controls

Extend `/admin/dashboard/seasonal-themes` with a **Student dashboards** group for Halloween:

| Control | Behaviour |
| --- | --- |
| Enable on student dashboards | Separate master, default off for existing configurations |
| Use annual season schedule | Inherits the existing Asia/Colombo date/time boundaries, including excluded years |
| Page groups | Student Home; PTE selections; IELTS selections/catalog; account/records/help pages |
| Dashboard palette | Background, card surface, main text, secondary text, accent and border, with contrast validation |
| Home/PTE/IELTS banner media | Separate desktop/mobile images with preview and fallback |
| Workspace background media | Separate desktop/mobile backgrounds; optional overlay strength |
| Banner text | Short greeting and supporting sentence; keep functional page titles and exam labels intact |
| Characters | Existing seven character identities; select one or two banner-edge placements, size and mobile visibility |
| Quiet banner animation | Off by default; optional low-motion glow/float inside banner only |
| Mobile dashboards | Respects the global mobile master and safe-area spacing |
| Preview | Student Home, PTE, IELTS, records, mobile, plus a trainer showing the standard appearance |
| Restore standard / rollback | Existing theme Off/Standard behaviour; retain previous published assets/settings |

The panel explicitly states that trainers, active tests, scoring, checkout and payments are excluded. Do not offer an override to enable them. Sound, promotional popup and full-screen flight controls are not exposed for this scope.

## Dedicated artwork: eight new files

Create these original assets under `public/seasonal/halloween/dashboard/`. They are separate from public homepage artwork and from the current standard dashboard images.

| File | Suggested export | Composition |
| --- | --- | --- |
| `home-banner.webp` | 1600 × 450 | Quiet plum study room, warm pumpkin lanterns and scholar ghost/robot on right; left 60% clear for greeting |
| `home-banner-mobile.webp` | 800 × 600 | Short, uncluttered composition with clear upper-left text area; characters at lower-right |
| `pte-banner.webp` | 1600 × 450 | Blue-accent microphone/headphones/books, book bat and wizard owl, small pumpkin; left text area clear |
| `pte-banner-mobile.webp` | 800 × 600 | Same PTE objects/characters, simplified for narrow screens |
| `ielts-banner.webp` | 1600 × 450 | Cranberry-accent globe/pen/books/headphones, witch kitten/fox beside pumpkin lantern; clear left text area |
| `ielts-banner-mobile.webp` | 800 × 600 | Same IELTS identity, simplified with no character behind headings or study-path tabs |
| `workspace-background.webp` | 1920 × 1200 | Very low-contrast plum gradient, faint stars and leaves only at outer edges; empty central content area |
| `workspace-background-mobile.webp` | 900 × 1600 | Minimal edge decoration; no illustrated objects beneath cards or the floating menu |

Artwork prompts: premium soft 3D educational illustration, friendly and calm, matching the established seven Halloween mascots; warm amber accents, controlled plum shadows, no frightening imagery, no text, letters, logos, scores, prices or numbers baked into the image. Keep interface text in HTML. Use existing transparent character cutouts when compositing banner-edge characters; do not introduce a different mascot identity.

Keep optimized banners around 100–180 KB where visual quality allows and backgrounds around 100 KB. Store the prompts and originals separately; use responsive sources and do not download both desktop and mobile banners on a phone. Current asset fallbacks remain available offline/in the standard theme.

## Readability and colours

Proposed starting tokens, to be checked in rendered screens before publishing:

| Token | Starting colour |
| --- | --- |
| Workspace | `#160F24` |
| Card surface | `#281B38` |
| Main text / numbers | `#F7F1FF` |
| Supporting text | `#D1C5DE` |
| Pumpkin action | `#FFB454` |
| Text on pumpkin action | `#201327` |
| Borders | `#685078` |

- Check normal text at least 4.5:1, large text and interactive boundaries at least 3:1. Check actual composed backgrounds, opacity, hover, selected, disabled and focus states, not just the hex palette.
- Define explicit themed styles for page headings, breadcrumbs, search/input placeholder and result dropdown, tabs, selected exam path, skill/task cards, credit counts, Unlimited labels, plan dates, paid/pending/error badges, links, empty/loading/error states and the floating menu/More popover.
- Keep paid/success, pending and failed statuses semantically distinct. Never change credit counts or statuses to decorative seasonal examples.
- Preserve PTE and IELTS identification through readable badges/labels; do not depend on blue/red alone to distinguish the exams.
- Neutral forms, chat messages, guide articles and existing screenshots keep dark lettering on light paper. Do not turn every text node white.
- Artwork needs a solid/gradient text backplate so no heading sits directly over a lantern or character. Keyboard focus, More, the accessibility launcher/panel and mobile safe areas must remain visible and non-overlapping.
- No automatic sound, flashing, flying objects over data or hover-only navigation. Respect reduced motion, paused/hidden tabs, low-power/mobile behaviour and Standard appearance.

## Files to implement

- Extend `src/lib/seasonal-theme/config.ts` with backward-compatible dashboard defaults and asset validation.
- New `src/lib/seasonal-theme/dashboard-routes.ts` and route-policy tests.
- Extend `src/components/seasonal/seasonal-theme-provider.tsx` without changing public route eligibility.
- New dashboard frame/banner components and a scoped dashboard seasonal stylesheet.
- Update `src/app/dashboard/layout.tsx`, `src/components/dashboard/student-views.tsx` and IELTS selection presentation to accept the scoped tokens/banner variants; preserve current page controllers and trainers.
- Extend `src/app/admin/dashboard/seasonal-themes/page.tsx` with the dashboard controls and private preview choices.
- Add eight assets and a reproducible read-only preview fixture for each allowed page family and one excluded trainer.
- Update website-guide screenshots after implementation so the guide can explain the themed layout while showing the standard training screen.

## Acceptance checks

1. Preview Off/On/automatic schedule/end-of-season/Standard appearance on Home, PTE and IELTS, records/settings/help and mobile.
2. Exercise exact allowlisted paths and every excluded trainer/attempt/review pattern, including direct links, legacy redirects and a navigation from a themed selection page to a timed test. Unknown future routes remain standard.
3. Verify the new credit panel shows the same live values and plan states in both appearances; purchase processing and scoring handlers are untouched.
4. Check search, dropdowns, Academic/General tabs, score/payment badges, inputs, error states and keyboard focus for contrast in screenshots, not just default headings.
5. Check 320, 390, 768 and desktop widths, increased text size and safe-area spacing. Neither the dock nor More may be covered by characters or the accessibility control.
6. Check missing images, slow loading, denied/expired private preview, stale public manifest, reduced motion and disabled mobile appearance. All fail safely to the standard UI or static artwork.
7. Run existing Halloween/Christmas runtime, publishing, scheduling and contrast checks plus the new route-policy tests, type check and production build. Do not change real published settings or create payments/attempts as part of visual QA.

Delivery order: route/activation protection first; dedicated art and tokens second; dashboard presentation third; admin controls/private previews fourth; contrast, navigation and restoration checks before any real activation.
