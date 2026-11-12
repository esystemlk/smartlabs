# IELTS Studio — separate web app plan

Prepared 12 November 2026. **Proposal only: nothing live has changed.** The sample pages in this folder (`signin.html`, `signup.html`, `dashboard.html`) are static mockups with sample data.

## 1. What we are building

**IELTS Studio** is a separate website on its own domain (for example `ieltsstudio.lk`) that does IELTS only. It reuses everything the Smart Labs site already has for IELTS: the practice runners, the 4 paid mock tests, scoring, credits, enrollments and the student account.

Both sites use **the same Firebase project** (`smart-labs-ekk8j`). That gives us, with no data copying:

- **Same login:** one Firebase Auth user list. An account made on either site works on both, with the same email and password or Google sign-in.
- **Same database:** the same Firestore collections (`users`, `ielts_mock_attempts`, `ielts_mock_credits`, `ielts_essay_credits`, `ielts_course_enrollments`, `ielts_reading_explanations`, …). A mock started on one site can be resumed and reviewed on the other.
- **Same questions and media:** the same mock registry (`src/lib/ielts-mock/`) and Firebase Storage files.

## 2. Recommendation: one codebase, two Vercel projects

**Decided (12 Nov 2026): IELTS Studio deploys as a new, separate Vercel project, not on the main smartlabs.lk project.** Both Vercel projects build from this same GitHub repo. The Studio project sets the environment variable `NEXT_PUBLIC_IELTS_STUDIO_MODE=1`, which makes every address it serves (its custom domain and its `*.vercel.app` previews) behave as IELTS Studio. The main project never sets it. A push to `main` redeploys both projects.

New Vercel project setup:

1. Vercel → Add New → Project → import the same GitHub repo (`esystemlk/smartlabs`).
2. Environment variables: copy the main project's server variables (Firebase admin config, Gemini keys, PayHere, email), then add `NEXT_PUBLIC_IELTS_STUDIO_MODE=1`. Optionally `NEXT_PUBLIC_IELTS_STUDIO_HOSTS=<studio domain>`.
3. Add the Studio domain to that project, to Firebase Authentication → Authorized domains, and to the Google OAuth client.

Scheduled jobs (`vercel.json` crons) run on the main project only: in the Studio project the middleware answers `/api/cron/*` with a no-op, so win-back and expiry emails are not sent twice.

The original "same project, two domains" option below still works (the host check is kept), but is not the chosen setup.

```
smartlabs.lk      ──►  existing site (PTE + IELTS + everything else)
ieltsstudio.lk    ──►  same app, middleware rewrites to /studio/*  (IELTS only)
```

- `src/middleware.ts` reads the `Host` header. Requests for the IELTS Studio domain are rewritten to a new route group (for example `src/app/(studio)/studio/...`). Requests for smartlabs.lk are untouched.
- The `/studio` pages are thin shells: new layout, new branding, new navigation, wrapping the **existing** components (`src/components/ielts/*`, `mock-runner`, `reading-runner`, `listening-runner`, `writing-runner`, `IeltsMockScorePDF`).
- The existing API routes (`/api/ielts-mock/*`, payments, credits) are shared as they are.

**Why this over a second repo/app:**

| | One codebase, two domains (recommended) | Separate app |
|---|---|---|
| Reuse of current IELTS parts | Direct imports, nothing to copy | Must extract into a shared package first |
| Bug fixes | Fixed once, both sites get it | Fix twice or keep a package in sync |
| Deploys | One deploy | Two deploys to keep compatible |
| Risk to smartlabs.lk | Low: new routes only, gated by domain | None, but more total work |
| Can split later | Yes, the `/studio` folder lifts out cleanly | — |

If IELTS Studio later needs its own team or release cycle, the `/studio` folder and the shared IELTS components can be moved into a package then. Starting with a split costs that work up front.

## 3. Login across the two domains

Same account does **not** mean automatically signed in on both: browsers keep each domain's session separately.

- **Phase 1 (enough to launch):** sign in once on each site with the same email/password or Google. Nothing extra to build.
- **Phase 2 (optional, smooth hand-off):** a "Continue to IELTS Studio" button on smartlabs.lk calls a server route that mints a short-lived Firebase **custom token** for the signed-in user; IELTS Studio signs in with it. One click, no second password. Token lifetime about 60 seconds, single use, sent by POST, never in the URL.

Setup needed for either phase:

1. Add the new domain to **Firebase Console → Authentication → Settings → Authorized domains**.
2. Add the new domain to the **Google OAuth client** (authorized JavaScript origins) so "Continue with Google" works there.
3. Add the new domain to the Vercel project.

## 4. Accounts and data rules

- Keep **one `users/{uid}` document** per person. Add two fields, without changing existing ones:
  - `signupSource: 'smartlabs' | 'ielts-studio'` — written once at sign-up.
  - `apps: ['smartlabs', 'ielts-studio']` — which sites the person has used (updated on sign-in).
- **Credits and purchases stay shared.** An IELTS mock credit bought on either site is usable on both. Pricing must match on both domains to avoid confusion.
- **Firestore security rules do not need changes:** they check the signed-in user, not the domain.
- **Payments (PayHere):** return/cancel URLs must follow the domain the student paid on. The notify (server) URL can stay on one domain, because it writes to the shared database. Register the new return domain with PayHere before launch.
- **Emails:** results and receipt emails should name the site the student used, using `signupSource` or the domain of the purchase.

## 5. Scope of IELTS Studio v1

Included (all already built for smartlabs.lk):

- Sign in, sign up, forgot password (new screens, same Firebase Auth)
- Dashboard (new design, see `dashboard.html`)
- Listening, Reading and Writing practice runners
- The 4 paid IELTS mock tests (Listening + Reading + Writing; overall = average of the three) with review and PDF score report
- Credits, purchases and payments
- Account settings

Not in v1: PTE content, Smart Labs courses and webinars, Speaking practice (the catalogue lists Speaking, but there is no Speaking runner or scoring yet; the dashboard shows it as "coming soon" rather than a dead link).

## 6. Design direction

The brief is "no AI-generated look". Concretely, the samples avoid:

- purple-blue gradients, glowing blobs, glass panels, floating 3D shapes, sparkle icons, emoji
- vague hero copy ("Unlock your potential"); every line says something specific
- identical card grids for everything

and use instead:

- **Paper and ink:** off-white background, near-black text, one accent colour (IELTS red `#B4161B`, close to the current Studio red `#C4161C`), thin rules instead of shadows
- **Editorial type:** a serif (Newsreader) for headings and band scores, IBM Plex Sans for interface text, tabular figures for numbers
- **Real information first:** target band, test date, the four skills with their latest band, the next mock, credits, recent results in a plain table
- **Honest empty states:** a skill with no attempts says "No attempts yet" instead of a fake progress chart

## 7. Build steps

1. Register the domain; add it to Vercel, Firebase Authorized domains, Google OAuth, PayHere.
2. Add `src/middleware.ts` host rewrite and the `(studio)` route group with layout and branding. Verify smartlabs.lk routes are unchanged.
3. Build Sign in / Sign up / Forgot password from the samples, reusing the existing Firebase Auth calls from `src/app/login` and `src/app/signup` (same role logic for admin/developer emails).
4. Build the dashboard from the sample, reading real data: `users`, `ielts_mock_attempts`, `ielts_mock_credits`, `ielts_essay_credits`.
5. Mount the existing practice and mock pages under `/studio`, with Studio navigation and "back" links.
6. Make payment return URLs and emails domain-aware.
7. Test on a Vercel preview with the new domain; then launch.
8. Optional Phase 2: one-click hand-off from smartlabs.lk.

## 8. Decisions needed from the owner

1. Domain name for IELTS Studio.
2. Should smartlabs.lk keep its own IELTS section, or link to IELTS Studio after launch?
3. Same prices on both sites? (Recommended: yes.)
4. Phase 2 one-click hand-off: now or later?
