# SmartLabs Mobile — PTE/AI Practice App Plan

A React Native + **Expo** app that reuses the **same accounts, same credits, same
database, and the same AI scoring flows** as the website (`smartlabs.lk`), with a
fresh visual design. Scope: **login + all practice modules** (every AI-scored type
*and* the interactive non-AI types), **Firebase JS SDK** for auth, **PayHere React
Native SDK** for credit top-ups.

> Decisions locked in: (1) cover **all** question types, (2) **Firebase JS SDK**,
> (3) **PayHere RN SDK**.

---

## 1. Why this is mostly a client project (not a rewrite)

The website's AI backend is already structured as **stateless HTTPS endpoints**
authenticated by a **Firebase ID token** — exactly what a mobile app needs. The
same endpoints, the same Firestore `users/{uid}` credit document, and the same
PayHere notify webhooks all work unchanged from a phone. React Native `fetch` is
native networking, so **CORS does not apply** (unlike a web client).

**Firebase project (shared):** `smart-labs-ekk8j` — same Auth + Firestore, so a
student's account and purchased credits are identical across web and app.

### Endpoints that already exist and are mobile-ready

| Module | Endpoint | Auth | Credits |
|---|---|---|---|
| Summarize Spoken Text | `POST /api/score-sst` | Bearer ID token | `sstFreeUsed` / `sstPaidCredits` / `sstMonthlyExpiry` |
| Summarize Written Text | `POST /api/score-swt` | Bearer ID token | `swtPaidCredits` pool |
| Write from Dictation | `POST /api/score-wfd` | Bearer ID token | wfd pool |
| Write Essay | `POST /api/score-essay` | Bearer ID token | essay pool |
| IELTS Essay | `POST /api/score-ielts-essay` | Bearer ID token | ielts pool |
| Text‑to‑Speech (listening audio) | `POST /api/tts` → base64 MP3 | Bearer ID token | — |
| Credit balances / top‑up notify | `/api/*-credits`, `/api/payhere/*-notify` | — | Firestore increments |

Each score route: verifies the ID token → checks the credit pool → calls Gemini
(5‑key round robin, model fallback) → **deducts a credit on success** → returns
structured JSON. The app calls them verbatim.

### What the backend is still missing for mobile

- **Speaking scoring has no HTTP route.** The logic exists as a Genkit flow
  (`src/ai/flows/score-pte-speaking.ts`, `scorePteSpeaking`, takes an audio data
  URI) but is only reachable as a server action, which RN cannot call. We must add
  thin API routes (see §5).
- **Question banks are static TS files** (`src/lib/pte-*-data.ts`), bundled into
  the Next.js app. The app needs the same data — options in §6.

---

## 2. Question-type inventory & how each is handled

**AI‑scored (spend a credit, hit a scoring endpoint):**

- *Speaking* → Read Aloud, Repeat Sentence, Describe Image, Retell Lecture,
  Answer Short Question, Summarize Group Discussion, Respond to a Situation.
  Record mic (`expo-audio`) → send audio data URI → **new** `/api/score-speaking`.
- *Writing* → Summarize Written Text (`/api/score-swt`), Write Essay (`/api/score-essay`).
- *Listening* → Summarize Spoken Text (`/api/score-sst`), Write from Dictation (`/api/score-wfd`).

**Interactive / non‑AI (scored deterministically against the answer key, no AI cost):**

- *Reading* → Fill in Blanks (R&W), MCQ (multiple), Re‑order Paragraphs, Fill in
  Blanks (drag & drop), MCQ (single).
- *Listening* → MCQ (multiple), Fill in Blanks, Highlight Correct Summary, MCQ
  (single), Select Missing Word, Highlight Incorrect Words.

For listening prompts (SST, WFD, and the listening interactive types) the app
generates audio via `/api/tts` and plays it — same as the site. Non‑AI types check
answers locally against the keys in the shared question data; **no credit is spent**.

---

## 3. App architecture (Expo)

```
smartlabs-app/                 # new Expo project (separate from the Next.js repo, or a workspace — see §7)
  app/                         # expo-router file-based navigation
    (auth)/login, signup, forgot-password
    (tabs)/                    # Home, Practice, Progress, Account
    practice/
      speaking/[task].tsx
      writing/[task].tsx
      reading/[task].tsx
      listening/[task].tsx
    result/[attemptId].tsx
    credits.tsx                # PayHere top-up
  src/
    firebase.ts                # Firebase JS SDK init (shared config)
    api/                       # typed fetch client: attaches Bearer token
      client.ts, score.ts, tts.ts, credits.ts, questions.ts
    auth/AuthContext.tsx       # onAuthStateChanged + token provider
    credits/CreditsContext.tsx # live Firestore user-doc subscription
    audio/                     # expo-audio record + playback helpers
    features/<module>/         # one folder per question type (UI + local scoring)
    ui/                        # new design system (theme, components)
```

**Core libraries**
- `expo`, `expo-router` (navigation), `firebase` (JS SDK — Auth + Firestore),
  `expo-audio` (record + playback), `expo-file-system` (audio→base64 data URI),
  `@payhere/payhere-mobilesdk-reactnative` (payments),
  `@tanstack/react-query` (server-state/caching), `zustand` or Context for app state.
- New UI kit (NativeWind/Tailwind or Tamagui) — **visual design is fresh**, not a
  port of the website's look.

**Config note:** Firebase JS SDK Auth in RN needs
`initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
so sessions survive app restarts. Google sign-in under the JS SDK uses
`expo-auth-session` (popup `signInWithPopup` is web-only).

---

## 4. Auth flow (shared accounts)

1. Email/password via `signInWithEmailAndPassword`; Google via `expo-auth-session`
   → `signInWithCredential`. Same users as the website — no migration.
2. `AuthContext` subscribes to `onAuthStateChanged`, exposes `getIdToken()`.
3. Every API call attaches `Authorization: Bearer <freshIdToken>`; the token
   auto-refreshes. Server routes already `verifyIdToken` — no server change.
4. Signup writes the same `users/{uid}` shape the website expects (role `student`,
   credit fields default). Confirm the exact default doc against the web signup
   handler before shipping.

## 5. AI scoring flow (per attempt)

1. App loads a question from the shared bank (§6).
2. Listening: `POST /api/tts` → play base64 MP3. Speaking: record with `expo-audio`.
3. Submit:
   - Writing/Listening-AI → `POST /api/score-{sst,swt,wfd,essay}` with the text
     (and transcript where required).
   - Speaking → **new** `POST /api/score-speaking` (see below) with the audio data URI.
4. Handle `402 NO_CREDITS` → route the user to the top-up screen. On success the
   server has already deducted the credit; the `CreditsContext` Firestore listener
   reflects the new balance live.
5. Render the returned rubric/feedback in the new result UI.

**Backend work required — add a speaking HTTP route.** Wrap the existing
`scorePteSpeaking` flow in `POST /api/score-speaking` mirroring the SST route:
Bearer-token verify → speaking credit pool check/deduct → call the flow → return
its JSON. Decide the speaking credit pool (reuse an existing pool or add
`speakingPaidCredits` / `speakingFreeUsed` on the user doc + admin credit
management, matching the SST pattern). This also benefits the website if it later
exposes speaking practice.

## 6. Sharing question-bank data (one source of truth)

The banks live in `src/lib/pte-*-data.ts`. To honor "same data" without drift,
**expose them through read-only API endpoints** and cache on the client:

- Add `GET /api/questions/[module]/[type]` (optionally Bearer-gated) that returns
  the same arrays the site imports. One source of truth; the app caches responses
  with React Query + offline persistence.
- Alternative (more refactor): move banks to Firestore and read directly from the
  app. Heavier; only worth it if content should change without a web deploy.

Recommended: **read API + client cache** now; Firestore migration later if needed.

## 7. Repo layout

The app is a **separate Expo project**. Two viable homes:
- **Standalone repo/folder** (`smartlabs-app/`) — simplest, fastest to start.
- **npm workspace next to the Next.js app** — lets a shared package hold TS types
  (score response shapes, question types) and, if desired, the question data.

Recommendation: start standalone to move fast; extract a shared `@smartlabs/types`
package once the score-response contracts stabilize.

## 8. Payments (PayHere RN SDK)

- `@payhere/payhere-mobilesdk-reactnative` launches native checkout with the same
  merchant account. On success, PayHere calls the **existing** server notify
  webhook (`/api/payhere/{sst,swt,essay,...}-notify`), which MD5-verifies and
  increments the shared Firestore credit pool — **credits sync automatically**.
- The app builds the same order payload (order id, amount, currency, item, the
  webhook `notify_url`, and the MD5 `hash`). The **hash must be generated
  server-side** — add a small `POST /api/payhere/mobile-hash` that returns the
  signed hash for a given order (never ship the merchant secret in the app).
- Store-policy note: Apple/Google generally require **IAP** for digital goods and
  take ~30%. PayHere may be fine for an Android sideload / web-linked flow, but
  **verify store rules before iOS/Play release**; IAP is a likely v2 requirement.

## 9. Environment & secrets

- **App:** only the public Firebase web config (already public in
  `src/firebase/config.ts`) + the API base URL (`https://www.smartlabs.lk`). No
  secrets in the bundle.
- **Server (unchanged):** `GOOGLE_GENAI_API_KEY_1..5`, `GOOGLE_CLOUD_TTS_API_KEY`,
  `PAYHERE_MERCHANT_SECRET`, Firebase Admin creds — stay server-side.

---

## 10. Phased delivery

**Phase 0 — Foundations (backend)**
- Add `POST /api/score-speaking` (wrap `scorePteSpeaking`) + speaking credit pool
  and admin credit management.
- Add `GET /api/questions/...` read endpoints (or confirm data-sharing approach).
- Add `POST /api/payhere/mobile-hash`.

**Phase 1 — App skeleton + auth + credits**
- Expo + expo-router + new design system. Firebase JS SDK with AsyncStorage
  persistence. Login/signup/forgot-password. Live credit balance from Firestore.

**Phase 2 — Writing & listening AI modules**
- SWT, Essay, IELTS Essay, SST, WFD end-to-end (TTS playback, submit, result UI,
  credit deduction, `402` → top-up).

**Phase 3 — Speaking modules**
- `expo-audio` record → data URI → `/api/score-speaking`. All 7 speaking types.

**Phase 4 — Interactive non-AI modules**
- All reading + listening interactive types with local scoring against the keys.

**Phase 5 — Payments + polish**
- PayHere RN checkout, purchase history, progress screen, empty/error states,
  offline handling, EAS build config.

**Phase 6 — Release**
- EAS builds; resolve store IAP policy; TestFlight / internal testing → launch.

---

## 11. Key risks / open items

- **Speaking route + speaking credit pool** is genuinely new backend work; confirm
  the pricing/pool model with the SST route as the template.
- **iOS/Play IAP policy** may force store IAP over PayHere for digital credits —
  confirm before store submission.
- **Exact `users/{uid}` default shape** on signup must match the website's handler.
- **TTS cost/latency** — `/api/tts` caps text at 800 chars; long listening prompts
  may need chunking or pre-generated audio.
- **Question-bank sync** — read-API vs Firestore migration decision (§6).

---

## 12. Bottom line

~80% of the AI backend is reusable **as-is**. The concrete new backend work is:
a speaking scoring route (+ its credit pool), question-bank read endpoints, and a
PayHere mobile-hash endpoint. Everything else — accounts, credits, scoring, TTS,
payment crediting — already works from a phone the moment it presents a Firebase ID
token. The app is primarily a **new-design Expo client** over the existing API.
