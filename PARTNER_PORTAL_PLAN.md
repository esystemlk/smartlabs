# SmartLabs Referral Partner Portal — implementation plan

Additive build on the existing Next.js + Firebase (Auth, Firestore, Storage, nodemailer)
stack. **Nothing in the student learning / AI / dashboard flows is changed.** Delivered in
phases per the requirements document.

## Data model (Firestore)
- `partner_applications/{ref}` — one per submitted application (server-written only).
- `partners/{uid}` — the partner profile + review/account state (server-written only).
- `partner_usernames/{usernameLower}` — `{ uid }`, enforces unique usernames (server-only).
- `referrals/{id}` — student referrals, `partnerUid` scoped (future phase).
- Security rules: all client **writes denied**; reads are owner-scoped or staff-only. Admin
  SDK does all writes on the server.

## Phase 1 — DONE (public page + registration + status) ✅
- Homepage **"Become a Partner"** hero link → `/partners`.
- **`/partners`** public info page (who can apply, how it works, approval, FAQ, contact) — responsive.
- **`/partners/register`** — Business/Individual application form with review step + client validation.
- **`POST /api/partners/apply`** — server validation, creates the Firebase Auth partner account,
  enforces unique username (transaction), stores the application + partner profile, emails an
  acknowledgement to the applicant (Reply-To contact@smartlabs.lk) and a notification to
  contact@smartlabs.lk. Generates an email-verification link. Rolls back the account if the
  application can't be saved.
- **`/partners/login`** — sign in with username **or** email (`/api/partners/resolve-username`
  resolves usernames), Firebase password auth, forgot-password reset.
- **`/partners/workspace`** — pending/approved/needs-info/rejected **status view** + email
  verification resend + sign out. (Full workspace features are Phase 3.)

## Phase 2 — Admin review (next)
- `/partners/admin` under the existing admin dashboard (staff-only): applications queue with
  search/filters, open an application, approve / reject / request info (with reason + reviewer),
  suspend/reactivate, partner management. Writes via admin API with audit logging.
- Logo upload (deferred from Phase 1): business logo upload to **private** storage, size/type/
  content validation.

## Phase 3 — Partner workspace (referrals)
- Refer a Student form (server attaches partnerUid, consent timestamp), My Referrals tracking,
  a stable non-guessable **referral link/code** + attribution on the enquiry form, Profile & Branding.

## Phase 4 — Logo review + homepage publication
- Independent logo review; a **Referral Partners** logo grid near the bottom of the homepage that
  publishes automatically only when: partnership approved + account active + logo approved + display
  permission + admin visibility on. Replacement-logo rules; cache invalidation on visibility change.

## ⚠️ Business decisions SmartLabs must make (from the spec, section 8)
1. Who can approve partnerships? (which staff role)
2. When are supporting business documents required?
3. How are competing referral claims resolved?
4. May rejected applicants reapply?
5. What student progress is shared with partners?
6. Record retention period.
7. Final programme wording; whether any rewards/commissions are offered (the first release does
   **not** calculate commissions or promise payments).

## Notes / assumptions to confirm
- Email uses the existing `sendMail` (Gmail via nodemailer). Ensure the sender is verified and
  `contact@smartlabs.lk` is monitored.
- Firebase Auth **authorized domains** must include smartlabs.lk for the verification link.
- Firestore rules above must be **published** (`firebase deploy --only firestore:rules` or paste in
  the console) for the read scoping to take effect.
