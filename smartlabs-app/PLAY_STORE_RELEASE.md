# SmartLabs PTE — Play Store Release Runbook

This is the step-by-step guide to build the Android app and publish it to Google Play.
Everything in **Part A** is done in the terminal (with your Expo/EAS login). Everything in
**Part B** is done by you in the **Google Play Console** (web).

App facts (already configured in the code):

| Item | Value |
|---|---|
| App name | **SmartLabs PTE** |
| Package name (Application ID) | `lk.smartlabs.app` |
| Version name | `1.0.0` |
| Version code | managed automatically by EAS (`autoIncrement`) |
| Target SDK | 36 (meets Play's 2025 requirement) |
| Min SDK | Expo default (24) |
| API backend | `https://www.smartlabs.lk` |
| Privacy Policy URL | `https://www.smartlabs.lk/policies` |
| Account deletion URL | `https://www.smartlabs.lk/delete-account` |
| EAS project id | `94071082-95d8-441a-b320-f65119f4ce18` |

---

## ⚠️ READ THIS FIRST — Google Play payments policy (important)

The app currently lets users **buy AI credits inside the app via PayHere**. Google Play's
**Payments policy requires Google Play Billing for digital goods bought and consumed inside an
Android app** (AI scoring credits count as digital goods). Shipping PayHere in-app checkout can
get the app **rejected or later removed**.

You have three safe options — pick one **before** submitting:

1. **Recommended for first release:** Remove the in-app "Buy credits" checkout from the Android
   app. Keep the credits screen showing the **balance** and a message like *"Top up on
   smartlabs.lk"* (link out to the website). Users buy on the web (PayHere is fine on the web) and
   the credits sync to the app. — I can make this change quickly; ask me.
2. Integrate **Google Play Billing** (react-native-iap / expo-in-app-purchases) for the Android app
   and give Google its cut. Bigger job.
3. Submit as-is and risk rejection. **Not recommended.**

Everything else below assumes the app is otherwise ready. Tell me which option you want and I'll
implement #1 if you choose it.

---

# PART A — Build & upload the app (terminal)

> Run these from `smartlabs-app/`. You need your **Expo account** (the one that owns EAS project
> `94071082-…`). PowerShell blocks `npx.ps1` — if you hit "running scripts is disabled", run
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npx.cmd`.

### A1. Install & log in to EAS
```
npm install -g eas-cli
eas login
```

### A2. Build the production Android App Bundle (.aab)
```
eas build --platform android --profile production
```
- This runs in the cloud (~15–25 min) and produces an **`.aab`** file.
- The **first** production build asks to generate a **Play upload keystore** — say **yes** and let
  EAS manage it (`eas credentials` can show it later). Keep this account safe; it signs all future
  updates.
- When it finishes, EAS prints a download link for the `.aab`. You can upload that manually (Part
  B6) **or** use `eas submit` (A3) to push it automatically.

### A3. (Optional) Auto-submit to Play — needs a service account key
This uploads the build straight to the **Internal testing** track as a **draft**.
1. Create the Google service account JSON (Part B2) and save it as
   `smartlabs-app/play-service-account.json` (it is **git-ignored — never commit it**).
2. Then:
```
eas submit --platform android --profile production --latest
```
If you'd rather upload the `.aab` by hand the first time, skip this and do Part B6.

### A4. Future updates
Bump `version` in `app.json` (e.g. `1.0.1`), then re-run A2 (and A3). EAS auto-increments the
version code. You can release updates to Play **any time** — Google review is usually hours to ~1–2
days.

---

# PART B — Google Play Console (web, done by you)

### B1. Create the developer account (one-time)
- Go to **play.google.com/console**, pay the **one-time $25** fee, complete identity verification
  (can take 1–2 days). Google now requires **D-U-N-S**/organization verification for company
  accounts, or ID for individual — have that ready.

### B2. Service account for `eas submit` (only if using A3)
- Play Console → **Setup → API access** → link a Google Cloud project → **Create service account**
  → in Google Cloud, create a **JSON key** → back in Play Console **grant it access** with the
  **"Release to testing tracks"** (and later "Release to production") permission.
- Download the JSON → save as `smartlabs-app/play-service-account.json`.

### B3. Create the app
- Play Console → **Create app**:
  - App name: **SmartLabs PTE**
  - Default language: **English (en-US)**
  - App or game: **App**
  - Free or paid: **Free** (purchases happen via credits, not a paid app)
  - Confirm the declarations.

### B4. Store listing (Grow → Store presence → Main store listing)
Prepare these assets:
- **App icon:** 512×512 PNG (you have a 1024×1024 — resize/export a 512).
- **Feature graphic:** 1024×500 PNG (required). *(Not in the repo yet — I can generate one.)*
- **Phone screenshots:** at least **2** (up to 8), 16:9 or 9:16, min 320px side. Capture from the
  running app (Splash, Home, a Practice trainer, Progress, Credits).
- **Short description** (≤80 chars), e.g.: *"AI-scored PTE practice — speaking, writing, reading &
  listening."*
- **Full description** (≤4000 chars): what the app does (all 4 skills, AI scoring, predictions,
  progress tracking, mock tests).

### B5. Required policy sections (App content — left menu)
Complete **every** item or you can't publish:
- **Privacy policy:** `https://www.smartlabs.lk/policies`
- **App access:** the app needs login. Provide a **test account** (email + password) so Google's
  reviewer can sign in, and note that some features need purchased/granted credits — so grant that
  test account credits (via Admin → Credit Manager) or a monthly plan.
- **Ads:** No ads → declare "No".
- **Content rating:** fill the questionnaire (education app, no objectionable content) → likely
  **Everyone**.
- **Target audience & content:** choose age groups (13+ / 18+). Not designed for children.
- **Data safety:** declare what you collect (see B7).
- **Government apps / Financial features:** if asked about payments — see the payments warning
  above.
- **Account deletion:** provide `https://www.smartlabs.lk/delete-account` (required because
  accounts can be created in-app).

### B6. Upload the build & make a release
- **Testing → Internal testing → Create new release** (do internal first, not production).
- Upload the **`.aab`** from Part A2 (or it's already there if you used `eas submit`).
- Add **release notes** (e.g. "First release — AI PTE practice across all four skills.").
- Add **internal testers** (your email list) → **Save → Review release → Start rollout to Internal
  testing**.
- Install via the tester opt-in link, verify it works on a real phone.
- When happy: **Production → Create new release** → promote the same build → **Send for review**.

### B7. Data safety answers (use these)
The app collects / handles:
- **Personal info:** Name, Email address — *collected*, for account management; not sold.
- **Audio:** Voice recordings (Speaking tasks) — *collected*, sent to the server for AI scoring.
  State whether they're stored or processed transiently (confirm with your backend; if not stored,
  say "not stored").
- **App activity / user content:** practice answers, scores.
- **Financial info:** purchases (handled by the payment provider, not stored by you directly).
- Data **encrypted in transit:** Yes. Users can **request deletion:** Yes (the deletion URL).

### B8. Permissions to justify
- **RECORD_AUDIO (microphone):** used only to record the student's spoken answers for AI scoring of
  Speaking tasks. Mention this in the listing/data-safety.

---

## Quick checklist
- [ ] Choose payments option (see warning) — ideally move buying to web for the app
- [ ] `eas login` → `eas build -p android --profile production`
- [ ] Create Play developer account ($25, verified)
- [ ] Create app "SmartLabs PTE" (package `lk.smartlabs.app`)
- [ ] Store listing: icon 512, feature graphic 1024×500, 2+ screenshots, descriptions
- [ ] App content: privacy policy, app access (test login + credits), content rating, data safety,
      account deletion, ads = no
- [ ] Upload `.aab` to Internal testing → test on a device
- [ ] Promote to Production → Send for review

---
*Generated for the SmartLabs PTE app. Ask Claude to (a) switch app credit-buying to web-only, or
(b) generate the feature graphic / help capture screenshots.*
