# SmartLabs PTE — Mobile App (Expo)

React Native + Expo client for PTE/AI practice. It shares **accounts, credits,
Firestore data and AI scoring** with the website (`smartlabs.lk`) — a student
signs in with the same account and any credits they buy here (or on the web)
work everywhere.

See [`../MOBILE_AI_APP_PLAN.md`](../MOBILE_AI_APP_PLAN.md) for the full plan.

## What's in this scaffold (Phase 1)

- **Auth** — email/password sign in, sign up, password reset (Firebase JS SDK,
  same project `smart-labs-ekk8j`, sessions persisted with AsyncStorage).
- **Live credits** — a Firestore listener on `users/{uid}` exposes every credit
  pool (speaking / SST / SWT / essay) in real time.
- **Practice catalogue** — loaded from `GET /api/questions?catalog=1` so it
  always matches the website.
- **Working SWT trainer** — a complete end-to-end AI flow (load passage → write
  summary → `POST /api/score-swt` → score + credit deduction). Other task types
  show a generic viewer wired to the same question bank, ready to build out.
- **PayHere credit purchase** — packages call `create-payment` and launch the
  PayHere RN SDK; the existing notify webhooks credit the shared account.

## Prerequisites

**The app calls the production backend**, so the Phase 0 API routes added in the
Next.js repo must be deployed first:

- `POST /api/score-speaking` and the `speaking` credit pool
- `POST /api/speaking-credits/create-payment` + `POST /api/payhere/speaking-notify`
- `GET  /api/questions`

Point the app at a different backend by editing `expo.extra.apiBaseUrl` in
[`app.json`](app.json) (defaults to `https://www.smartlabs.lk`).

## Run

```bash
npm install
npx expo start
```

Open in **Expo Go** (scan the QR) for auth, credits, catalogue and the SWT
trainer. Note:

- **PayHere checkout** needs a native dev build (`npx expo run:android` /
  `run:ios`) with `@payhere/payhere-mobilesdk-reactnative` added — in Expo Go the
  buy flow creates the order but reports checkout as unavailable.
- **Speaking recording** (Phase 3) uses `expo-audio` and also needs a dev build
  for the microphone on device.

## Structure

```
app/                      expo-router screens
  (auth)/                 login, signup, forgot-password
  (tabs)/                 Home, Practice, Account
  practice/[taskType]     per-task trainer (SWT working; others generic)
  credits.tsx             PayHere top-up (modal)
src/
  config.ts firebase.ts   shared Firebase config + init
  theme.ts ui/            design system (fresh, not the website's look)
  api/                    typed clients: questions, score, tts, credits
  auth/ credits/          React contexts (auth state, live credit balances)
  payments/payhere.ts     PayHere SDK launcher (lazy-loaded)
```

## Implemented trainers

- **Writing/Listening AI** — SWT, Write Essay, SST (TTS listen → summary), WFD
  (TTS listen → type, scored locally with the ported deterministic engine).
- **Speaking (all 7)** — Read Aloud, Repeat Sentence, Describe Image (renders the
  inline SVG), Retell Lecture, Answer Short Question, Summarize Group Discussion,
  Respond to a Situation. Record with the mic → `/api/score-speaking` → Content /
  Fluency / Pronunciation / overall + transcript + tips (speaking credit pool).
  Needs a **dev build** for the microphone (Android records AAC, iOS WAV — both
  Gemini-friendly).

## Roadmap

Phase 4 interactive non-AI types (reading/listening MCQ, reorder, fill-blanks,
highlight) · Phase 5 payments polish + EAS builds. Resolve app-store IAP policy
before store release (see the plan).
