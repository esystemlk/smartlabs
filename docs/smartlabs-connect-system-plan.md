# SmartLabs Connect — system and delivery plan

Status: proposed architecture, 6 October 2026. This document is a plan; no application, Firebase deployment, or Play Store release has been created by this work.

## Product

A mobile-first white-and-red booking platform for SmartLabs students, SmartLabs lecturers, and approved independent teachers. Students use the same application in a browser, as an installed PWA, or through an Android Play Store package. Administrators use a separate web portal. Start with scheduled individual lessons; add group classes after the booking and payment workflow is reliable.

## Application structure

- Student and lecturer application: app.<chosen-domain>, responsive Next.js and TypeScript PWA.
- Admin application: admin.<chosen-domain>, separate single-page dashboard with sidebar sections and dedicated authentication. No admin tools in the student navigation.
- Firebase Authentication for accounts, Cloud Firestore for structured data, Cloud Storage for approved images/documents, trusted server endpoints or Cloud Functions for sensitive actions, and notification delivery through FCM plus email.
- Separate development, staging, and production Firebase projects. Prefer a new project for the marketplace until integration with the existing SmartLabs LMS is deliberately designed.
- Share design components and validated data types between applications. Existing website content and local edits should remain separate from this initial planning work.

## Roles and access

| Role | Capabilities |
| --- | --- |
| Student | Register, verify email, browse approved teachers, book published slots, view own lessons, request cancellation/rescheduling, manage profile |
| Lecturer | Manage own public profile, subjects, pricing, availability, and assigned lessons; see only the student details necessary for those lessons |
| Independent teacher | Apply to teach under SmartLabs; use lecturer tools only after approval and an active plan |
| Organization manager (later) | Manage approved staff and schedules within their organization |
| Support administrator | Review users, applications, bookings, and support cases within granted permissions |
| Finance administrator | Reconcile payments, refunds, commissions, and payouts |
| Super administrator | Approve administrators, configure plans, assign privileges, suspend organizations, and review audit records |

An account can be both student and lecturer. Use explicit organization memberships; never infer access from a selected screen or an email domain.

## Student screens and journey

1. Welcome and registration: email/password or Google sign-in, email verification, consent, timezone, and minimal profile.
2. Home: next lesson, recommended teachers, subjects, booking reminders, and clear empty states.
3. Find a teacher: search by subject, language, price, and available date. Clearly label SmartLabs lecturers and approved partner teachers.
4. Teacher profile: biography, qualifications, teaching language, session duration, price, cancellation terms, and available slots. Public profiles exclude identity documents and private contact details.
5. Booking: choose date/time, see local timezone, review price and terms, confirm availability, and pay if required. Show confirmation only after authoritative server confirmation.
6. My lessons: upcoming/completed/cancelled tabs, meeting access, cancellation/rescheduling requests, and verified lesson reviews.
7. Account: profile, notification preferences, receipts, privacy controls, support, and account deletion request.

Mobile bottom navigation: Home, Teachers, Lessons, Account. Desktop uses the same content with wider layouts.

## Lecturer screens and journey

- Application: identity/contact information, subjects, credentials, teaching experience, and plan choice. Submission stays pending until admin approval.
- Dashboard: upcoming lessons, profile completion, availability summary, and earnings summary.
- Availability calendar: recurring weekly hours, dated exceptions, holidays, session duration, buffers, minimum notice, and booking horizon.
- Lesson management: assigned students, attendance, meeting link, and permitted cancellation actions.
- Profile editor: biography, subjects, language, fees, and public photograph; sensitive changes can require review.
- Plan and earnings: entitlement, renewal status, invoices, commission deductions, and payout status.

Availability example: Monday and Wednesday 18:00–21:00 Asia/Colombo, 60-minute lessons, 15-minute buffer. Store instants in UTC and retain the lecturer's IANA timezone for recurring schedules and daylight-saving conversions.

## Independent-teacher business model

Start with one approved partner-teacher plan rather than many pricing tiers. SmartLabs controls onboarding, permitted subjects, service quality, and suspension. Keep subscription fee, commission rate, trial period, payout timing, and refund responsibility configurable; amounts require business decisions.

Workflow: application -> review -> approved -> plan entitlement activated -> public profile published. Rejection includes a reason and a controlled resubmission path. Expired plans prevent new bookings while existing confirmed lessons and refunds remain accessible. A commission-only model can be added later.

## Admin single-page portal

A dedicated responsive dashboard with a persistent sidebar and these sections:

- Overview: bookings, active teachers/students, pending applications, cancellation rate, and payment exceptions.
- Users: search, role/membership review, suspension, and deletion requests.
- Teacher approvals: review credentials, request changes, approve/reject, and retain decision history.
- Organizations: SmartLabs and partner organizations, staff memberships, and status.
- Availability and bookings: calendar, conflicts, attendance, rescheduling, and cancellations.
- Plans: pricing, entitlements, commission policy, and effective dates.
- Finance: confirmed payments, failed payments, refunds, payouts, and reconciliation.
- Subjects and content: categories, featured profiles, help content, and announcements.
- Support and reports: cases, abuse reports, and moderation.
- Settings and audit: policies, administrator permissions, and immutable action history.

Use pagination and filtered summaries rather than downloading every record. Require an explicit confirmation for refunds, suspension, and other destructive actions. Log the actor, action, target, timestamp, reason, and correlation ID.

## Firestore model

| Collection | Purpose and important fields |
| --- | --- |
| users/{uid} | Private account settings, display name, timezone, status; privileged role fields are server-owned |
| organizations/{orgId} | Name, type, status, billing owner |
| organizations/{orgId}/members/{uid} | Role, approval state, membership status |
| teacherApplications/{id} | Applicant UID, organization, review status, private credential references |
| publicTeacherProfiles/{uid} | Approved public fields, subjects, language, fee summary, organization ID |
| teacherSettings/{uid} | Private meeting and payout settings |
| availabilityRules/{id} | Teacher UID, organization ID, timezone, weekly schedule, effective range |
| availabilityExceptions/{id} | Date-specific closures or overrides |
| lessonSlots/{id} | Teacher UID, start/end UTC, public availability, reservation state |
| bookings/{id} | Student UID, teacher UID, organization ID, slot IDs, status, price snapshot, policy snapshot |
| bookingEvents/{id} | Server-created booking transition history |
| plans/{id} | Published plan details and version |
| subscriptions/{id} | Teacher/organization entitlement and renewal state, server-owned |
| payments/{id} | Provider references, booking/subscription reference, verified state; no card information |
| payouts/{id} | Teacher, period, amount, status, reconciliation reference |
| reviews/{id} | Completed booking reference, student/teacher IDs, rating, moderation state |
| notifications/{id} | Recipient UID, safe message payload, read status |
| auditLogs/{id} | Server-only administrative action history |

Define composite indexes from actual queries: teacher + slot start + status; student + lesson start; teacher + lesson start; organization + booking status + start; application status + submitted date. Paginate every growing list. Public search may initially use indexed subject/language filters; add a dedicated search engine only when full-text requirements justify it.

## Booking correctness

1. Client submits slot, authenticated user, and an idempotency key. Price, entitlement, policy, and availability are recalculated on the server.
2. Server verifies account status and email, approved teacher, active plan, timing rules, and capacity.
3. A Firestore transaction reserves deterministic time-block documents for the teacher and a booking hold. For variable durations, reserve every occupied block including buffers to prevent overlapping appointments.
4. Payment is created against the hold. A signed, verified, replay-safe webhook updates payment state; the browser redirect cannot confirm payment.
5. Confirmation atomically validates the hold and assigns the slot. Expired holds are released through a scheduled job and transaction checks; TTL deletion alone is not the correctness mechanism.
6. Late successful payment after hold expiry enters reconciliation/refund handling rather than automatically taking another student's slot.
7. Rescheduling reserves the replacement and releases the original atomically. Cancellation and refund records are separate, with server-enforced policy snapshots.

Booking states: held, pending_payment, confirmed, completed, cancelled, expired. Record attendance/no-show separately. Restrict transitions on the server. Send reminders through idempotent jobs and include the correct participant timezone.

## Security plan

- Default-deny Firestore and Storage rules. Separate public profiles from private user and application records; rules cannot hide individual fields in an otherwise readable document.
- Use Firebase Authentication and verified tokens. Assign privileged custom claims only through the Admin SDK in trusted infrastructure. Never allow self-selected admin roles or self-approved lecturer status.
- Enforce organization membership and ownership for every read/write, including server endpoints. Admin SDK bypasses Firestore rules, so backend authorization is mandatory.
- Students read only their bookings; lecturers read only assigned bookings and necessary participant information. Public slot documents must never expose the booking student's identity.
- Clients cannot write payment state, plan entitlements, booking confirmations, administrator privileges, approvals, or audit history.
- Require administrator MFA, least-privilege permissions, short administrative sessions, and reauthentication for sensitive operations. Confirm Firebase/Identity Platform support and cost during setup.
- Enable App Check for supported services and verify it on custom endpoints where appropriate. It complements authentication and authorization.
- Validate schemas, field allowlists, file types/sizes, and state transitions. Quarantine credential uploads from public assets. Escape user content; restrict meeting-link schemes and hosts.
- Keep secrets in managed server secrets, never client bundles. Apply rate limits to registration, search, reservations, password recovery, and notification jobs.
- Use HTTPS, a restrictive content security policy, secure session cookies where used, CSRF protection for cookie-authenticated mutations, and sanitized logs.
- Avoid persistent shared-device caches of private information. Clear local user state on logout. Do not service-worker-cache authenticated API responses, payments, admin pages, or meeting credentials.
- Set retention/deletion rules for documents and personal data, maintain tested backups and restore procedures, monitor abuse and costs, and maintain an incident response process.
- Test rules with the Firebase Emulator Suite: unauthenticated access, student-to-student isolation, teacher-to-teacher isolation, organization boundaries, field tampering, revoked access, and forbidden privilege changes. Test concurrent booking and duplicate/out-of-order webhooks against the server.

Firebase references: https://firebase.google.com/docs/firestore/security/overview and https://firebase.google.com/docs/auth/admin/custom-claims

## White-and-red UI and skeleton loading

- White surfaces, pale gray page background, dark readable text, and deep red (#C51F32) primary buttons/navigation accents. Reserve lighter red for decorative backgrounds and validation states with accessible text.
- Rounded cards, restrained shadows, clear typography, labeled icons, large touch targets, keyboard navigation, and visible focus indicators.
- Teacher directory skeleton: avatar circle, name/subject lines, price line, and action placeholder.
- Profile skeleton: portrait, biography lines, and calendar grid.
- Lessons skeleton: date badge and lesson rows.
- Lecturer calendar skeleton: weekday headers and schedule blocks.
- Admin skeleton: metric cards, table headers/rows, and chart placeholders.
- Use Next.js route loading boundaries plus component skeletons for asynchronous data. Render stable dimensions to avoid jumps; do not add artificial loading delays.
- Mark loading regions aria-busy, hide decorative skeletons from assistive technology, provide a concise loading status, and respect reduced-motion preferences.
- Resolve loading into success, empty, permission-denied, offline, or error/retry states. Disable submission while pending and protect server actions with idempotency.

## PWA and Android release

- Web manifest with application identity, standalone display, start URL, theme/background colors, 192/512 icons, and maskable icons.
- Service worker caches versioned static assets and an offline fallback. Public content can use an explicitly bounded cache. Booking changes and payment require an online server response.
- Add installation guidance, reconnect feedback, update notification, and safe refresh behavior during active booking.
- Package the hosted PWA as a Trusted Web Activity using Bubblewrap or PWABuilder, producing an Android App Bundle. Validate Digital Asset Links using the production domain, final package ID, and Play App Signing certificate.
- Prepare Play Console access, app signing, store artwork/screenshots, description, privacy policy, account deletion access, Data Safety declaration, content rating, reviewer access, testing tracks, and the current target API requirements. Verify account-specific testing requirements at release time.
- Treat Play approval as an external release gate. A working browser PWA is not automatically a Play Store release.
- Payment design must distinguish live one-to-one lessons, recorded/group digital courses, and teacher software subscriptions. Check Google Play payment policy for each offering before implementing Android checkout; do not assume the website payment gateway can be used inside the Play app.

Android references: https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities and https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
Payment policy: https://support.google.com/googleplay/android-developer/answer/10281818 and https://support.google.com/googleplay/android-developer/answer/9858738

## Delivery phases and acceptance gates

1. Foundation: finalize organization and payment model, Firebase environments, role matrix, design system, screen prototypes, and rules tests.
2. Booking MVP: authentication, approved teacher directory, lecturer availability, atomic booking, cancellation, notifications, and basic admin approvals. Verify timezone display and simultaneous requests for the same slot.
3. Commercial operations: verified payments, plan entitlement, commission ledger, refunds, and finance tools. Verify replayed webhooks, expired holds, and reconciliation.
4. PWA readiness: skeleton/error/empty states, install assets, safe offline behavior, responsive accessibility checks, performance checks, and real Android device tests.
5. Play release: signed Android bundle, domain validation, policy/billing review, testing track, store listing, and production rollout after release checks.

MVP excludes recordings, AI tutoring, complex course bundles, chat, and multiple-teacher group sessions. These can be integrated with the existing SmartLabs LMS later.

## Decisions needed before implementation

- Separate application or extension of the current site; final product name and domain.
- Individual lessons only or group classes at launch; online, in-person, or both.
- Teacher subscription versus commission, pricing, payout method, and refund rules.
- Whether students pay in the app or bookings initially require no payment.
- Meeting provider and responsibility for generating session links.
- Existing Firebase/account reuse versus a new Firebase project; migration requirements.
- Student age range, guardian requirements if applicable, and operating regions.
- Google Play developer account availability and ownership.

## Confirmed scope and mobile app experience

Confirmed by the owner: this is a separate new application; prepare the complete system plan before implementation.

On mobile devices the student and lecturer interface must feel like a complete mobile application:

- Use an app shell rather than a marketing website layout: compact top app bar, screen title, back button on detail screens, and fixed bottom navigation on primary screens. No large desktop header or website footer in the mobile app.
- Student bottom navigation: Home, Teachers, Lessons, Account.
- Lecturer bottom navigation: Home, Availability, Lessons, Account. Profile, earnings, and plan management live under Account and contextual dashboard links.
- Support users with both roles through an explicit role switch in Account. Preserve each role's navigation and screen state independently; switching roles never grants permissions.
- Keep bottom navigation visible on primary screens. For focused booking, registration, and editing steps, use a full-screen flow with a back button, progress indicator, and a sticky primary action.
- Use icon-and-text navigation labels, a clearly highlighted red active item, and accessible tap targets of at least 44 by 44 CSS pixels. Show unread counts sparingly.
- Respect device safe areas at the top and bottom; add bottom padding so navigation and sticky actions never cover content. Use dynamic viewport sizing and handle the on-screen keyboard without hiding form controls.
- Show teacher profiles as mobile cards; use day selection plus a vertical slot list on narrow screens rather than shrinking a desktop calendar. Lecturer availability uses a day/week switch and an easy Add availability action.
- Use bottom sheets for filters, slot details, and lightweight actions. Use dedicated screens for long forms and important confirmations. Support normal browser and Android back behavior and direct links to individual screens.
- Preserve filters and scroll position when returning from a teacher profile. Avoid interactions that depend on hover. Use brief transitions that respect reduced-motion settings.
- Skeletons follow the mobile shell: navigation and the screen title appear immediately while only the data region shows placeholders. Keep skeleton dimensions consistent with final cards.
- Support small and large phones, landscape, tablets, browser use, installed standalone PWA, and the Android TWA. The desktop layout can use a sidebar and wider columns while retaining the same journeys.
- The admin portal remains a separate web application. On phones its sidebar becomes a drawer, tables use readable cards or controlled horizontal scrolling, and administrative actions remain accessible.

Mobile acceptance checks: no horizontal page overflow at 320 CSS pixels; no obscured controls around device notches, keyboard, or bottom navigation; correct back behavior; reachable actions with touch and keyboard; readable text at increased font size; and verified layouts in browser, installed PWA, and Android package on real devices.
