# SmartLabs website guide

Public route: `/guide`. Student route: `/dashboard/guide`. Both render the same searchable content from `src/lib/student-guide.ts` through `src/components/guide/website-guide.tsx`.

The ten chapters cover accounts, Student Home, PTE, IELTS, mock credits, course registration, payment status, saved results, mobile navigation, and support/settings. There are no My Classes, live-class joining or learning-resource workflows. The content distinguishes course registration from practice access and mock credits, and shared practice results from IELTS mock history.

Entry points: Student Home's “New to SmartLabs?” card, floating menu More → Website guide, dashboard practice search, signup page, support chat, public footer, public command search and sitemap. Public access to the guide does not grant access to any protected student page.

## Screenshot sources

Eight browser captures are published as optimized WebP files in `public/images/guide` with descriptive alternative text, correct intrinsic dimensions and full-size image links.

- `create-account` and `courses`: captures of the actual locally served Next.js public pages, with empty forms. No account was created and no checkout was started.
- `student-home`, `pte-skills`, `ielts-skills`, `mobile-navigation`: read-only screenshots of the real website presentation components rendered with the actual compiled CSS, navigation and accessibility launcher by `scripts/preview-student-workspace.cjs`. The preview has no Firebase, account or payment connection.
- `registrations` and `results`: the real route and record components rendered in that isolated preview with empty records. Its hook adapters skip loading effects and cannot read or write student data. The guide captions explicitly identify layout/empty-state examples.

These are browser screenshots, not AI-generated UI mockups. The original PNG captures remain locally in the ignored `tmp/guide-capture-originals` directory. Refresh screenshots whenever the interface changes. Use public pages or the isolated preview; do not publish personal student records or payment details.

## Floating accessibility control fix

The global accessibility launcher is a sibling of the dashboard layout. The dashboard stylesheet detects an actual floating dock with `body:has(.student-dock)` and moves the launcher and its panel above it, including device safe-area spacing. Magnifier mode retains its existing top placement. Public pages and exam pages without the dock retain their original launcher position. The More popover stacks above the launcher so its links remain tappable. Browser geometry checks found no overlap at 320, 390, 768 and 1280 pixels.

## Checks

- `node scripts/test-student-guide.cjs`: chapter anchors, guide destinations, screenshot dimensions and alternate descriptions, shared guide routes.
- `node scripts/test-student-navigation.cjs`: practice navigation and legacy links; also writes the static internal-link audit.
- `npm run typecheck` and `npm run build`.
- Browser checks: desktop/mobile guide layout, chapter search and clear state, chapter anchor links, screenshot enlargement, and dock/accessibility positioning.
