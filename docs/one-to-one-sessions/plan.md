# One-to-One Sessions — Full Plan

Status: BUILT 2026-11-21 (not yet deployed). Differences from the plan below:
- Lecturer access = admin links the lecturer's SmartLabs login email to their profile (no new `lecturer` role).
- No Firestore rules change: every `oto_*` collection is server-only and the existing default-deny rule covers it.
- Expired payment holds are ignored automatically (no cleanup job needed).
- Emails (student + lecturer + admin): booking confirmed, cancelled, and reminders at 6:00 PM the
  evening before, 7:00 AM on the class day (or 2 h before an earlier class), 1 hour before, and at start.
  Reminder job: `GET /api/cron/one-to-one-reminders` (each reminder sent once; missed ones are skipped).
  Lecturer email = linked login email, else the private "Email for booking alerts" field.

### Reminder trigger setup (free)
Vercel Hobby only allows daily jobs, so `vercel.json` runs the job daily at ~6:30 PM and ~7:30 AM
(Sri Lanka) as a backup. For the 1-hour and starting reminders, add a free pinger:
1. Make a free account at https://cron-job.org → Create cronjob.
2. URL: `https://smartlabs.lk/api/cron/one-to-one-reminders`, schedule: every 10 minutes.
3. If `CRON_SECRET` is set in Vercel, add a request header `Authorization: Bearer <CRON_SECRET>`
   (Advanced → Headers). Without the header the job answers 401 and nothing is sent.
4. Save, then press "Test run" and check the response says `"ok":true`.
- If a lecturer can't teach, admin cancels the booking → full refund (no reschedule tool).
- Code: `src/lib/one-to-one.ts` (+ `.test.ts`), `src/lib/one-to-one-server.ts`, `src/app/api/one-to-one/*`,
  `src/app/api/payhere/one-to-one-notify`, `src/app/one-to-one/*`, `src/app/admin/dashboard/one-to-one`.

A separate booking area on smartlabs.lk where students book private sessions with a
named lecturer, online (Zoom) or physical, for 1, 2 or 3 hours.

Three sides:

| Side | URL | Who |
|---|---|---|
| Student | `/one-to-one` (browse) and `/one-to-one/my-bookings` | anyone browses, signed-in students book |
| Lecturer | `/one-to-one/lecturer` | users with the new `lecturer` role |
| Admin | `/admin/dashboard/one-to-one` | existing admin / developer staff |

Built on what the site already has: Firebase Auth + Firestore, `verifyAuthed` /
`verifyStaff` (`src/lib/api-auth.ts`), PayHere checkout + `payment_orders` + an MD5-checked
notify route (same as `src/app/api/payhere/recording-notify`), `/api/upload` for photos,
`src/lib/mail.ts` for emails, and the `cleanup-pending-payments` cron.

---

## 1. Student journey

1. **Browse lecturers** at `/one-to-one`: photo, name, subjects (PTE / IELTS / Spoken English…),
   short bio, and price per hour for **Online** and **Physical** (only the modes that lecturer offers).
2. **Pick a lecturer → pick mode → pick hours (1 h, 2 h, 3 h).**
3. **Pick a date** on a calendar. Only dates where the lecturer has free time are clickable.
4. **Pick a start time.** The list shows start times every 30 minutes that can still fit the
   chosen length (see §3). Price total = hourly price × hours.
5. **Read and tick the cancellation policy** (§5), then pay with PayHere.
6. The slot is **held for 15 minutes** while paying. If payment fails or times out, the hold is
   released automatically.
7. On payment success the booking is **Confirmed**; the student gets an email with date, time,
   lecturer and mode.
8. **My bookings** shows upcoming and past sessions, status, a countdown, and a Cancel button.
9. **Join button:** for online sessions, the Zoom link appears **only from 30 minutes before the
   start until the session ends**. Before that the card says "Your Zoom link will appear here
   30 minutes before your class." For physical sessions it shows the class address instead.

## 2. Lecturer side (`/one-to-one/lecturer`)

- Sign in with their normal SmartLabs account; admin gives that account the `lecturer` role
  and links it to their lecturer profile.
- **My availability:** add time windows per date, e.g. Sunday 23 Nov, 9:00 AM – 12:00 PM.
  Option to repeat weekly for N weeks. They can delete a window only if no booking sits inside it.
- **My sessions:** list of their booked sessions (student name, date, time, mode, hours).
  They see the Zoom link the same way students do.
- **My earnings:** confirmed hours and amounts, paid / unpaid (read-only).
- Lecturers cannot see prices other lecturers get, other lecturers' bookings, or admin pages.

## 3. Time-slot rule (the core logic)

Settings (admin-editable, defaults): **start step = 30 min**, **cooldown between sessions = 30 min**.

A start time `S` for a session of `H` hours is shown only if:

1. `S` is on the 30-minute grid inside an availability window, and `S + H` ends **inside** that window;
2. `S` is not in the past (and at least 2 hours from now, so the lecturer has notice);
3. the range `S … S+H` does not touch any existing booking **plus 30 min cooldown on each side**
   (held-for-payment bookings count too).

**Worked example** — lecturer available Sunday 9:00 – 12:00:

| Situation | Starts shown for 1 h | for 2 h | for 3 h |
|---|---|---|---|
| Nothing booked | 9:00, 9:30, 10:00, 10:30, 11:00 | 9:00, 9:30, 10:00 | 9:00 |
| Student A booked 9:00–10:00 | 10:30, 11:00 | — (10:30+2 h = 12:30, too late) | — |
| A 9:00–10:00 and B 10:30–11:30 | none | none | none |
| Student A booked 10:00–11:00 | none (9:00 ends inside A's cooldown; 11:30 ends 12:30, too late) | none | none |

So in your example, after a 9–10 booking the next student automatically sees **10:30** as the
first start. The check runs **again on the server inside a Firestore transaction** at booking time,
so two students clicking the same slot at once can never both get it.

All times are Sri Lanka time (Asia/Colombo); stored as UTC timestamps.

## 4. Zoom link security

- The link is **never stored in a document students can read.** It lives in an admin-only
  collection and is returned only by `GET /api/one-to-one/join?booking=…`.
- That API checks: signed in, the booking belongs to this student (or this lecturer / staff),
  booking is Confirmed, and **now is between start − 30 min and end**. Otherwise it returns nothing.
- The page polls the countdown and calls the API once the 30-minute mark is reached, so the
  button appears on its own without refreshing.
- One recurring link **per lecturer** (recommended, because two lecturers can teach at the same
  hour) with an optional global fallback link. *Decision needed — see §10.*

## 5. Cancellation & refund policy (student-facing text)

> **Cancellation & Refund Policy**
>
> Our lecturers' time is reserved exclusively for you, and every booked hour is an hour another
> student could not book. To keep the schedule fair for everyone, the following applies:
>
> - **3 or more days before your session** — cancel from *My bookings* and receive a **full refund**.
> - **Less than 3 days before your session (but before the session day)** — the booking is
>   **non-refundable**. At SmartLabs' discretion, part of the amount may be offered as credit toward
>   a SmartLabs course.
> - **On the day of the session, or not attending** — **no refund**.
> - **Medical reasons** — if you cannot attend due to illness, submit a valid medical certificate
>   before or within 48 hours of the session and we will issue a **full refund**, regardless of timing.
>
> Refunds are returned to the original payment method within 7–14 working days.
> If SmartLabs or the lecturer must cancel, you will receive a full refund or a free reschedule.

The student must tick "I have read and agree to the cancellation policy" before paying.

How it works in the system:
- Cancel button computes which band applies and **shows it before confirming** ("You are cancelling
  5 days ahead — you will receive a full refund of LKR 9,000").
- The slot is freed immediately after cancelling.
- Medical: student uploads the certificate on the cancelled booking; admin approves/rejects.
- PayHere refunds are issued by the admin in the PayHere portal; the admin then clicks
  **Mark refunded** (amount + note). The system records who, when and how much.

## 6. Admin side (`/admin/dashboard/one-to-one`)

Tabs:

1. **Lecturers** — add / edit / deactivate: photo (upload), name, title, bio, subjects, modes
   offered, **student price per hour** (online, physical), **lecturer pay per hour** (private —
   set at registration), Zoom link, linked login account.
2. **Availability** — view/edit any lecturer's windows (in case a lecturer can't do it themselves).
3. **Bookings** — filter by date / lecturer / status; open a booking to see payment, student,
   history; cancel on behalf (lecturer sick → full refund); mark no-show.
4. **Session confirmations** — after each session ends it appears here. The admin officer enters
   the **actual start and end time** and clicks **Confirm completed**. Only confirmed sessions
   count toward lecturer pay.
5. **Lecturer payments** — per lecturer per month: confirmed hours × their hourly pay = amount
   due. Admin clicks **Mark paid** (date, reference). Shows unpaid totals at the top. CSV export.
6. **Refunds & medical** — cancellations waiting for refund, medical certificates to review.
7. **Settings** — cooldown minutes, start-step minutes, hold minutes, minimum notice, fallback
   Zoom link, physical class address, policy text.

## 7. Data (Firestore)

| Collection | Holds | Who can read |
|---|---|---|
| `oto_lecturers/{id}` | public profile, prices, modes, active, `uid` | everyone |
| `oto_lecturer_private/{id}` | pay per hour, Zoom link, phone | admin only (via API) |
| `oto_availability/{id}` | lecturerId, start, end | everyone (needed to show slots) |
| `oto_bookings/{id}` | student, lecturer, mode, start, end, hours, price, status, payment, cancel/refund, completion | the student, the lecturer, admin |
| `oto_payouts/{id}` | lecturer, month, hours, amount, paid date, ref | admin; lecturer sees own |
| `oto_settings/main` | cooldown, step, hold, address, policy | everyone (no secrets) |

Booking status: `held` → `confirmed` → `completed` (admin) / `cancelled` / `no_show`.
All writes go through API routes with firebase-admin (client write access = none), matching how
payments already work.

## 8. API routes (`src/app/api/one-to-one/…`)

- `GET  slots?lecturer&date&hours` — compute free starts (§3)
- `POST book` — transaction: re-check slot, create `held` booking + PayHere order
- `POST /api/payhere/one-to-one-notify` — verify MD5, `held` → `confirmed`, send email
- `POST cancel` — apply policy band, free slot, notify admin
- `GET  join?booking` — Zoom link with the 30-min window check (§4)
- `POST lecturer/availability` — lecturer adds/removes own windows
- `POST admin/*` — lecturers CRUD, confirm completion, mark refunded, mark payout paid, settings
- Extend `cron/cleanup-pending-payments` to release expired `held` bookings

## 9. Build order

1. Data + slot logic (`src/lib/one-to-one/slots.ts`) with tests for the worked examples above.
2. Admin: lecturers + settings (so there is something to show).
3. Lecturer availability page + `lecturer` role in rules / auth.
4. Student browse → book → PayHere → confirmed, My bookings, Join link window.
5. Cancellation + refund + medical flow.
6. Admin confirmations + lecturer payments.
7. Emails (booking confirmed, cancelled, reminder 24 h before), header link, sitemap.
8. Publish Firestore rules (separately from the code deploy).

## 10. Decisions (answered 2026-11-21)

1. **Zoom link:** one recurring link **per lecturer**, plus an optional global fallback.
2. **Lecturer pay:** **booked hours** × lecturer rate, counted only after the officer confirms the
   session happened (officer still records actual start/end for the record).
3. **Inside-3-days cancellation:** **no refund**; admin may optionally give course credit.
4. **Physical sessions:** **one SmartLabs address** for all, set in Settings.
5. Still open: **lecturer cancels / is sick** — plan assumes the student picks full refund or free reschedule.
