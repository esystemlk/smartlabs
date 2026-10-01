# SmartLabs PTE — Play Store release runbook (v1.0.0)

Everything needed to publish the Android app to Google Play. **Part A** is the
build (EAS cloud). **Part B** is what *you* do in the Play Console. **Part C** is
uploading the build. **Part D** is compliance notes to avoid rejection.

---

## ✅ Already done for you (app is release-ready)
- App config cleaned — **`expo-doctor` passes 17/17**, TypeScript compiles with no errors.
- `app.json`: name **SmartLabs PTE**, version **1.0.0**, package **`lk.smartlabs.app`**, API base **https://www.smartlabs.lk**.
- Converted to a clean **managed Expo project** (removed the stale local `android/` folder) so EAS builds a correctly **release-signed `.aab`** — no debug-keystore problem.
- `eas.json` production profile already builds an **App Bundle (.aab)** — the format Play requires for a first upload.
- **Play-compliant payments**: all credit buying happens on the website; the app does not sell digital goods in-app (see Part D).
- Store art is ready in `smartlabs-app/store-assets/`:
  - `store-icon-512.png` (app icon, 512×512)
  - `feature-graphic-1024x500.png` (feature graphic)

---

## Part A — Build the AAB with EAS (≈15–25 min, mostly waiting)

You need a **free Expo account** (expo.dev). Run these on your PC:

```bash
npm install -g eas-cli
cd "C:\Users\SMART LABS\Desktop\smartlabs-2\smartlabs-app"
eas login
eas build -p android --profile production
```

- On the **first** build EAS asks: *"Generate a new Android Keystore?"* → answer **Yes**.
  EAS creates and safely stores your signing key — you never have to manage a keystore file.
- When it finishes, EAS prints a build page URL. Open it and **Download** the `.aab`
  (e.g. `SmartLabs-PTE-1.0.0.aab`). That is the file you upload to Play.

> Version numbers: `eas.json` uses `appVersionSource: remote` with `autoIncrement`,
> so EAS manages the Android `versionCode` automatically on every build. For the next
> release just bump `version` in `app.json` (e.g. `1.0.1`) and run the build again.

---

## Part B — Google Play Console setup (your side, one-time)

### B1. Developer account
- Go to https://play.google.com/console → pay the **one-time US$25** registration (if not already done).
- Complete identity verification (Google may take 1–2 days — do this first if the account is new).

### B2. Create the app
**All apps → Create app**
- App name: **SmartLabs PTE**
- Default language: **English (United States)** (or English (UK))
- App or game: **App**
- Free or paid: **Free**
- Accept the declarations → **Create app**.

### B3. Fill "Set up your app" (left nav → **Dashboard** → complete each task)
1. **App access** — the app needs login. Choose *"All functionality is restricted"* and add a **test student account** (email + password) so Google's reviewer can sign in. Create a throwaway student on smartlabs.lk and paste the credentials here.
2. **Ads** — select **No, my app does not contain ads** (unless you add some).
3. **Content rating** — fill the questionnaire (Education app, no violence/gambling). You'll get an "Everyone/PEGI 3" rating.
4. **Target audience and content** — target age **18+** (or 13+); answer the children's-policy questions truthfully.
5. **Data safety** — declare what the app collects. Typical answers for this app:
   - Collects: **Name, Email address** (account), **Audio** (speaking practice for AI scoring), **App activity** (progress).
   - Is data encrypted in transit: **Yes**.
   - Do you sell data: **No**.
   - Can users request deletion: **Yes** (point to contact@smartlabs.lk).
   - Audio: used for **App functionality** (scoring), not shared, not for tracking.
6. **Government apps** — No.
7. **Financial features** — No.
8. **Privacy policy** — URL: **https://www.smartlabs.lk/policies**

### B4. Main store listing (left nav → **Store presence → Main store listing**)
- **App name:** SmartLabs PTE
- **Short description** (≤80 chars), e.g.:
  `AI-powered PTE & IELTS practice — speaking, writing, mock tests & instant scoring.`
- **Full description** (≤4000 chars) — describe PTE/IELTS practice, AI scoring, mock tests, recorded classes, progress tracking.
- **App icon:** upload `store-assets/store-icon-512.png`
- **Feature graphic:** upload `store-assets/feature-graphic-1024x500.png`
- **Phone screenshots:** **at least 2** (recommended 4–8), PNG/JPG, 16:9 or 9:16.
  *Take these on a phone or emulator: home, a speaking practice screen, scoring result, mock test.*
- **App category:** **Education**
- **Contact details:** email (e.g. info@smartlabs.lk), website https://www.smartlabs.lk
- Save.

---

## Part C — Upload the build and release

**Recommended first path: Internal testing → then Production.**

### C1. Internal testing (fastest — live in minutes to your testers)
1. Left nav → **Testing → Internal testing → Create new release**.
2. If asked about **Play App Signing**, **accept** (let Google manage the app signing key — this is the safe default and means you can never be locked out by a lost key).
3. **Upload** the `.aab` from Part A.
4. Release name: `1.0.0`. Add release notes (e.g. "First release").
5. **Save → Review release → Start rollout to Internal testing**.
6. On the **Testers** tab, add your email(s) to a tester list, copy the **opt-in link**, open it on your phone, and install via Play. Verify login, speaking recording, and scoring all work.

### C2. Promote to Production
Once internal testing looks good:
1. Left nav → **Production → Create new release**.
2. Reuse the same `.aab` (Play lets you promote the internal build) or upload again.
3. Add release notes → **Review** → **Start rollout to Production**.
4. Google reviews it (typically a few hours to a few days for a new app). You'll get an email when it's live.

### C3. (Optional) Automate future submits with `eas submit`
Instead of manual uploads later, you can run:
```bash
eas submit -p android --profile production
```
This needs a Google **service account key**:
1. Play Console → **Setup → API access → Create new service account** (opens Google Cloud).
2. In Google Cloud, create the service account and a **JSON key**; download it.
3. Back in Play Console, grant that account **Release manager** access.
4. Save the JSON as `smartlabs-app/play-service-account.json` (already gitignored).
*(For the very first release, manual upload in C1/C2 is simplest — set this up later.)*

---

## Part D — Compliance notes (read before you submit)

1. **Payments / Play billing — the #1 rejection risk.**
   Google requires that **digital goods used inside the app** be sold via Google Play
   Billing. We deliberately **do not sell credits in the app** — buying is on the
   website only. Keep it that way: the app may **show a balance** and let users
   **manage top-ups on smartlabs.lk**, but must **not** present an in-app "Buy credits"
   button that funnels to a web checkout. If a reviewer flags payments, the response is
   "all purchases occur on our website; the app provides learning features only."

2. **Microphone permission.** The app requests `RECORD_AUDIO` for speaking practice.
   This is declared in `app.json` with a usage description — no extra Play form needed,
   but your Data safety answers (Part B5) must mention audio.

3. **Privacy policy must be reachable** at https://www.smartlabs.lk/policies before you submit.

4. **Test account.** Provide working student credentials in **App access** (B3.1) or the
   review will fail at the login screen.

5. **First upload must be an `.aab`** (not APK). The EAS production profile already
   produces an `.aab`. ✔

---

## Quick checklist
- [ ] `eas login` → `eas build -p android --profile production` → download `.aab`
- [ ] Play Console: create app **SmartLabs PTE**, package `lk.smartlabs.app`
- [ ] Complete App access (+ test login), Ads, Content rating, Target audience, Data safety, Privacy policy
- [ ] Store listing: short/full description, icon 512, feature graphic, ≥2 screenshots, category Education
- [ ] Internal testing release → upload `.aab` → accept Play App Signing → test on your phone
- [ ] Promote to Production → Start rollout → wait for Google review
