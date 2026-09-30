# SmartLabs Partner Referral Workspace — architecture & build spec

**Status:** design doc for Phase 3 (partner workspace) + expanded partner administration.
**Principle:** additive only. No change to student learning, AI scoring, credits, or the existing
admin dashboard. All Firestore **writes stay server-side** (admin SDK); clients only read
owner-scoped or staff-scoped data. Builds on Phases 1–2 (application, login, admin review) that
are already live.

---

## 1. Goals — what each side needs

### What SmartLabs needs (the business)
1. **Trustworthy attribution** — know which partner brought which student, with a timestamp and a
   tamper-proof server record, so commissions/credit are never disputed.
2. **Control over money exposure** — nothing pays out automatically. Every referral moves through
   explicit states (`new → contacted → enrolled → paid → rewarded`) that **staff** advance. A
   partner can never mark their own referral as "enrolled" or "paid".
3. **A kill switch per partner** — instantly **ban** (permanent), **deactivate** (temporary), or
   **suspend pending review** any partner, cutting off their login and freezing new attributions,
   without deleting history.
4. **One place to manage everyone** — a roster of all partners with status, totals, and per-partner
   actions, plus an audit trail of every admin action.
5. **Broadcast + targeted email** — send a maintenance/announcement email to all active partners,
   or a direct message to one, from inside the admin.
6. **Privacy compliance** — partners see only the minimum about their referred students (name +
   status), never PII beyond what the student consented to share.

### What partners need (the workspace)
1. **A referral link + code** they can share; anything that comes through it is auto-credited to them.
2. **A "Refer a student" form** for manual referrals (name, phone/email, note) with student consent.
3. **My Referrals** — a live list with status badges and dates, and simple totals
   (referred / enrolled / rewarded).
4. **Earnings view** — what each converted referral is worth (driven by the commission the admin
   already configures) and a running estimate. *Display only in the first release — no payout engine.*
5. **Profile & branding** — edit contact details, business logo upload (business partners),
   password/email management.
6. **Clear account state** — if they're deactivated/banned, an unmistakable message and who to contact.
7. **Fully responsive** on mobile and desktop, matching the current site styling.

---

## 2. Account lifecycle — the state machine

Two independent fields already exist on `partners/{uid}`:

- `reviewStatus`: `pending | needs_info | approved | rejected | withdrawn` (application outcome).
- `accountState`: **the operational switch** — extend to:
  `pending_activation | active | suspended | deactivated | banned | closed`.

| accountState        | Can log in? | Referral link works? | New attributions? | Set by | Reversible |
|---------------------|:-----------:|:--------------------:|:-----------------:|--------|:----------:|
| `pending_activation`| yes (status only) | no | no | system (pre-approval / unverified email) | — |
| `active`            | yes (full)  | yes | yes | approve + email verified | — |
| `suspended`         | yes (read-only banner) | no | no | admin, "under review" | yes → active |
| `deactivated`       | **no** (temp lockout msg) | no | no | admin, temporary | yes → active |
| `banned`            | **no** (permanent msg) | no | no | admin, permanent | only by admin override |
| `closed`            | no | no | no | reject/withdraw | — |

**Rules of the machine**
- Only `active` + email-verified + `reviewStatus=approved` unlocks referral tools and the referral link.
- **Ban / deactivate never delete data.** Existing referrals stay attributed for historical/payout
  integrity; only *new* attribution stops.
- A **deactivated** partner's referral link returns a neutral "this link is inactive" page (no error,
  no data leak). Incoming enquiries via a dead link fall back to the normal (unattributed) flow.
- Login gating is enforced **server-side** on every referral API and mirrored in the workspace UI —
  never trust the client to self-block.

---

## 3. Data model additions (Firestore)

Existing: `partner_applications/{ref}`, `partners/{uid}`, `partner_usernames/{usernameLower}`,
`partner_settings/commission`.

### New / extended
```
partners/{uid}  (extend)
  accountState        : see §2
  referralCode        : string   // stable, non-guessable, e.g. "SL-7GQ2KD" (assigned on activation)
  stateReason         : string?  // last admin note for suspend/deactivate/ban
  stateChangedBy      : uid?
  stateChangedAt      : ts?
  counters            : { referred, enrolled, rewarded }   // denormalised, server-maintained
  logoStatus          : not_uploaded | pending | approved | rejected   // Phase 4
  logoPath            : string?   // private storage path

partner_codes/{code}            // reverse lookup for O(1) attribution
  -> { uid, active: bool }

referrals/{id}
  partnerUid          : string   // owner
  code                : string   // the code used (or "manual")
  studentName         : string
  studentContact      : string?  // phone/email as consented
  studentUid          : string?  // linked if they create an account
  source              : link | manual
  status              : new | contacted | enrolled | paid | rewarded | rejected
  consentAt           : ts       // student consented to be referred
  note                : string?
  rewardAmount        : number?  // set by staff at "rewarded"
  createdAt, updatedAt: ts
  history             : [{ status, by, at, note }]   // status-change audit

partner_broadcasts/{id}          // record of admin emails to partners
  subject, body, audience(active|all|one), sentBy, sentAt, recipientCount

admin_actions/{id}               // ALREADY EXISTS — reuse for partner_state changes
  type: 'partner_state', action: ban|deactivate|suspend|reactivate|reward|...
```

### Attribution rule (single source of truth)
A referral belongs to the **first** partner whose code the student used, captured at enquiry time
and frozen. Later clicks on other links do not re-attribute. Competing/manual duplicates are flagged
for staff (open decision #3 in the plan).

---

## 4. Referral attribution mechanics

- **Code**: assigned once, on first activation, written to `partners/{uid}.referralCode` and to
  `partner_codes/{code}` (active flag mirrors accountState). Format: `SL-` + 6 base32 chars, checked
  unique in a transaction. Never reused after ban.
- **Link**: `https://smartlabs.lk/r/{code}` → a thin route that (a) checks `partner_codes/{code}.active`,
  (b) sets a first-party `ref` cookie (90-day, `SameSite=Lax`), (c) 302-redirects to the normal
  enquiry/registration page. Dead/paused code → neutral inactive page, no attribution.
- **Capture**: existing student enquiry / PTE-registration / signup forms read the `ref` cookie and
  POST it. A server route resolves code → uid, writes a `referrals` doc with `consentAt`, and
  increments `counters.referred` in the same transaction. **Attribution only ever happens on the
  server.** Never place the code in a URL query that carries PII.
- **Manual referral**: partner submits the Refer-a-Student form; server attaches `partnerUid`,
  `source:'manual'`, `consentAt` (partner attests consent), status `new`.

---

## 5. Partner workspace — dashboard design

Route: `/partners/workspace` (already exists as a status view). Grows into a tabbed dashboard.
Gated: renders tools only when `active` + verified + approved; otherwise shows the state banner.

```
┌─ Partner Workspace ───────────────────────────────  [Sign out] ┐
│ Hi Dinuka · Business partner · Ref PA-… · ● Active              │
│                                                                 │
│ [ Overview ] [ My Referrals ] [ Share ] [ Earnings ] [ Profile ]│
├─────────────────────────────────────────────────────────────────┤
│ OVERVIEW                                                        │
│  ┌ Referred ┐ ┌ Enrolled ┐ ┌ Rewarded ┐   (counter cards)      │
│  │   24     │ │    9      │ │    7      │                        │
│  Your link:  smartlabs.lk/r/SL-7GQ2KD   [Copy] [QR] [Share]     │
│  Recent activity (last 5 referrals)                              │
├─────────────────────────────────────────────────────────────────┤
│ MY REFERRALS   search / filter by status                        │
│  Name         Source   Status      Date       Reward            │
│  R. Perera    link     ● Enrolled  12 Sep     LKR 1,500         │
│  …            manual   ● Contacted 10 Sep     —                  │
│  (student contact shown only if consented; status is read-only) │
├─────────────────────────────────────────────────────────────────┤
│ SHARE                                                           │
│  Big copyable link + QR code + prewritten WhatsApp/email blurbs │
│  "Refer a student" manual form (name, contact, consent check)   │
├─────────────────────────────────────────────────────────────────┤
│ EARNINGS  (display-only, from partner_settings/commission)      │
│  Rate table + estimated total from rewarded referrals + note    │
│  "Payouts are processed by SmartLabs; this is an estimate."     │
├─────────────────────────────────────────────────────────────────┤
│ PROFILE                                                         │
│  Contact details (reuses resubmit-style form) · change password │
│  Business logo upload + review status (Phase 4) · email verify  │
└─────────────────────────────────────────────────────────────────┘
```

Components to build (reuse existing styling / `CreditsPill`-style patterns):
- `PartnerTabs` shell, `CounterCards`, `ReferralTable` (client reads own `referrals`),
  `SharePanel` (copy + `qrcode` SVG + share intents), `ManualReferralForm`,
  `EarningsPanel` (reuse `CommissionSettings` shape from `earnings.tsx`), `ProfilePanel`.
- All reads are **owner-scoped** (`where partnerUid == auth.uid`); all mutations POST to server APIs.

---

## 6. Admin — manage all active partners

Extend `/partners/admin` (staff-only, already has **Applications** + **Commission** tabs) with a
new **Partners** tab (roster) and a **Broadcast** action.

### Partners roster
- Table of every partner: name/business, username, type, `accountState` badge, referred/enrolled/
  rewarded counts, joined date. Search by name/username/email; filter by state.
- **Row → detail drawer** with full profile, application ref, referral list, and the action bar:

| Action | Effect | Requires |
|--------|--------|----------|
| **Suspend** | `accountState → suspended` (read-only login, link paused) | reason |
| **Deactivate (temporary)** | `accountState → deactivated` (login blocked) | reason + optional auto-reactivate date |
| **Reactivate** | back to `active`, code re-enabled | — |
| **Ban (permanent)** | `accountState → banned`, code retired, login blocked | reason + typed confirm |
| **Edit details** | correct partner profile fields | — |
| **Message partner** | direct email (Reply-To contact@smartlabs.lk) | subject + body |
| **Advance referral** | set a referral's status / reward amount | staff only |

Every action: transactional write to `partners/{uid}` (+ `partner_codes` active flag) **and** an
`admin_actions` audit row, then an email to the partner explaining the change.

### Broadcast / maintenance email
- **Compose** panel: audience = `active` | `all` | single partner; subject + HTML body; preview.
- Server route fans out via `sendMail` **sequentially/awaited** (Vercel kills fire-and-forget),
  records a `partner_broadcasts` doc with recipient count. Rate-limited; BCC-style (one mail each,
  never expose addresses).
- Use cases the user asked for: "we're doing maintenance", "commission rates updated", "new rules".

---

## 7. APIs to build (all `runtime='nodejs'`, staff- or owner-gated by ID token)

Partner (owner-authed):
- `POST /api/partners/referrals/create` — manual referral (validate, attach uid, consent, increment).
- `GET  /r/{code}` (route handler) — validate code, set `ref` cookie, redirect.
- `POST /api/partners/profile/update` — edit own contact details (reuse resubmit validation).
- `POST /api/partners/logo` — upload to private storage (Phase 4).

Public capture (no auth, server-side attribution):
- `POST /api/partners/attribute` — called by enquiry/signup forms with the `ref` cookie; writes referral.

Staff-authed (reuse `requireStaff` from `admin/review/route.ts`):
- `POST /api/partners/admin/state` — suspend | deactivate | reactivate | ban (transaction + audit + email).
- `POST /api/partners/admin/referral` — advance status / set reward.
- `POST /api/partners/admin/broadcast` — audience email fan-out + `partner_broadcasts` record.
- `POST /api/partners/admin/profile` — edit a partner's details.

---

## 8. Security rules (additions to publish)
```
match /referrals/{id} {
  allow read: if isStaff() || (isAuthed() && resource.data.partnerUid == request.auth.uid);
  allow write: if false;                       // server only
}
match /partner_codes/{code} {
  allow read: if false;                        // resolved server-side only
  allow write: if false;
}
match /partner_broadcasts/{id} {
  allow read: if isStaff();
  allow write: if false;
}
// partners/{uid}: keep existing owner-read + staff-read; writes stay false.
```
Storage (Phase 4): private `partner-logos/{uid}/…`, staff read + owner read of own, writes server-only
with size/type validation.

---

## 9. Emails (all awaited)
- Partner state change (suspended/deactivated/reactivated/banned) — reason included, Reply-To contact@.
- Manual-referral received (optional receipt to partner).
- Referral converted → "your referral enrolled" (optional, encourages partners).
- Admin broadcast / maintenance.
- Reuse the `sendMail({ to, subject, html, replyTo })` helper.

---

## 10. Privacy & anti-abuse
- Partners see student **name + referral status** only; contact shown only if the student consented.
- Never compile or expose student PII beyond consent; never put codes/PII in query strings.
- Attribution frozen at first touch; duplicate/self-referral detection flags for staff.
- All state gating enforced server-side; the UI mirror is convenience only.
- Full audit trail in `admin_actions` for every state/reward change.

---

## 11. Build order (suggested, each shippable)
1. **State machine + admin roster + ban/deactivate/suspend/reactivate** (the user's core ask) —
   `accountState` extension, `/partners/admin` Partners tab, `state` API, login/workspace gating, emails.
2. **Referral code + link + attribution** — code assignment on activation, `/r/{code}`, cookie,
   `attribute` API, wire into one enquiry form.
3. **Partner workspace tabs** — Overview counters, My Referrals table, Share panel, manual referral,
   Earnings display, Profile edit.
4. **Admin referral management** — advance status, set reward, Broadcast email.
5. **Phase 4** — logo upload/review + homepage partner grid.

---

## 12. Open decisions for SmartLabs (confirm before build)
1. **Commission model** — flat per enrolment, %, or tiered? (drives Earnings + reward amounts)
2. **When does a referral count as "rewarded"** — on enrolment, on first payment, or after a hold period?
3. **Auto-reactivate** deactivated partners on a date, or always manual?
4. **Referral cookie window** — 90 days proposed; confirm.
5. **Duplicate/competing referral** resolution policy.
6. **What student status** partners may see (name only, or +enrolment stage).
7. Do banned partners' historical referrals **still pay out**, or forfeit? (proposed: honour already-earned.)
```
```
