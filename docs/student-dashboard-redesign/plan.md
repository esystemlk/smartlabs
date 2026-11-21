# Smart Labs student dashboard redesign

Prepared 19 October 2026. **Design proposal only: no application screens, routes, payments or live settings have been changed.**

Product scope confirmed by the owner: this website provides **PTE/IELTS practice and course registration**, not class delivery. The proposed student interface excludes Resources, My Classes, Join Class, teaching schedules, recordings and course-delivery features. Existing files for those features are not permission to include them in this redesign.

## 1. Recommendation

Make `/dashboard` a neutral **Student Home** with two large, equally visible entrances: **PTE Academic** and **IELTS**. Give each exam a separate dashboard with its four skills in the same position. Keep registrations and practice results in separate, clearly named areas.

The intended journey is:

**Student Home → Choose exam → Choose skill → Choose task → Practise → Review feedback.**

A second, separate journey is:

**Student Home / My Registrations → Register for a course → Payment / confirmation → Track registration status.**

Registering for a course must not imply that lessons, live classes or course materials are delivered on this website. Do not add a class-management dashboard. Registration confirmation timing and email copy must reflect the existing backend; sample helper text in a concept image is not a promise of an automated confirmation service.

## 2. Problems found in the current source

These are source-review findings and usability hypotheses consistent with the reported student complaints; they are not results of a student usability study.

| Finding | Source evidence | Design response |
|---|---|---|
| The common dashboard looks like a PTE-only area | `src/app/dashboard/page.tsx` leads with PTE practice; `dashboard/layout.tsx` labels the non-IELTS shell “PTE Platform” | Rename the common area Student Home; give PTE and IELTS equal first-screen entry cards |
| Three PTE skills are missing from the persistent sidebar | `practiceNav` in `dashboard/layout.tsx` includes only Writing | Make all four skills visible inside PTE; keep the PTE parent link visible everywhere |
| IELTS has conflicting availability messages | Shared dashboard arrays disable several IELTS skills; the dedicated Studio has Reading/Listening collections and Academic Writing routes | Use a single availability source; remove stale shared skill cards rather than maintaining two competing lists |
| Navigation names overlap | Dashboard, Practice Hub, AI Score Test, Practice Tests and IELTS Studio appear in different components | Use PTE Academic, IELTS, Practice tasks, Mock tests and Results consistently; use “AI feedback” as a feature label |
| Counts are duplicated and inconsistent | The shared PTE heading says 20 question types; its arrays contain 22 task entries: 7 Speaking, 2 Writing, 5 Reading, 8 Listening | Derive displayed counts from the existing task catalogue; these are source-entry counts, not a claim about official exam rules |
| Practice pages live in several route families | `/dashboard/practice/*`, `/ai-essay-practice`, `/swt-trainer`, `/ai-sst-practice`, `/ai-wfd-practice`, `/ai-ielts-essay-practice` | Preserve working URLs but add consistent exam context and return destinations |
| Class-delivery links distract from the actual product | Current dashboard/sidebar includes recordings and schedule links | Remove these from the proposed student navigation, according to the owner's correction; do not delete their data or routes during a navigation update |
| A progress destination is not yet a real reporting screen | `dashboard/progress/page.tsx` contains placeholder text | Use real practice history first; display honest empty states instead of fabricated progress charts |
| Mock reporting needs clear scope | `src/lib/ielts-mock/mocks.ts` describes Listening, Reading and Writing components and a three-component practice average | Label the mock's included components and practice summary; do not present it as a complete official IELTS result |

Additional relevant sources: `src/lib/pte-catalog.ts` already centralises PTE task metadata; `src/lib/ielts-catalog.ts` defines IELTS skill names; `src/components/ielts/studio.tsx` currently carries collection/availability presentation; `dashboard/ielts/mock-tests/page.tsx` has a dedicated mock catalogue and access/payment flow. Route existence alone does not prove live content, scoring or access works; validate readiness before exposing an action.

## 3. Proposed navigation

### Desktop

Keep these exact primary labels and order in the shared sidebar:

1. **Home**
2. **PTE Academic**
3. **IELTS**
4. **My Registrations**
5. **Results**
6. **Help**

Settings and sign out belong in the profile area. Payment history/receipts are reached from My Registrations; practice-credit balances are shown where they are used, with a secondary account link. Resources and classroom features are not primary or hidden-menu items in this proposal.

Inside PTE, expand Speaking, Writing, Reading and Listening under its parent. Inside IELTS, expand Listening, Reading, Writing, Speaking and Mock tests. Keep the other exam's parent link visible, so switching exams never requires returning to the marketing website.

The sidebar wordmark subtitle is **Student Space**, never PTE Platform for the whole application. The page title and breadcrumb identify the active exam. A compact exam switch on exam pages provides the same two choices; it must not introduce another set of feature names.

### Mobile

Use five labelled bottom destinations: **Home · Practice · Registrations · Results · More**. More contains Help and Settings, not classroom features. Keep a visible exam selector at the top of exam pages and large skill tiles below it. The drawer becomes secondary rather than the only way to find practice.

Practice opens an exam chooser for a new student; for a returning student it can open the last explicitly selected exam, with the other exam always visible in the selector. A remembered preference must never hide either exam from Home. Route context is authoritative on direct links; an IELTS URL must never display a PTE selection because of an old preference.

During an active timed/recorded attempt, use the existing focused exam layout rather than displaying a large sidebar and bottom navigation over the runner. Preserve save/exit protections and microphone/media behaviour. Do not switch the exam or lose responses silently.

## 4. Student Home specification

Order the page by what students need to do, not by every available tool.

| Priority | Block | Content and behaviour |
|---|---|---|
| 1 | Page title | “What would you like to practise?” and one short sentence |
| 1 | PTE Academic card | Full exam name; Speaking / Writing / Reading / Listening; **Open PTE dashboard** |
| 1 | IELTS card | Full exam name; Listening / Reading / Writing / Speaking; **Open IELTS dashboard** |
| 2 | Continue practice | Show only if a real resumable attempt exists; include exam, skill and task, with **Resume practice** |
| 3 | My registrations summary | Actual registration and payment status; **View registration** or **Register for a course** |
| 3 | Recent practice results | A few real, clearly exam-labelled results; **View all results** |
| 4 | Help | “Not sure where to start?” with a short exam-navigation guide/support link |

Both exam entrances should be visible immediately on common desktop and mobile sizes. Keep the mobile exam cards compact; do not use a large greeting illustration that pushes IELTS below a long list of PTE tasks. Full task lists belong inside exam dashboards.

Do not show upcoming lessons, Join Class, Resources, course recordings, course-completion percentages or instructional course content. Do not make course registration a prerequisite for discovering the practice sections; enforce actual practice entitlements only where required.

New students see the two exam cards and an optional short “How practice works” explanation. Empty practice history says **No practice results yet** with an exam CTA. No registrations says **You have no registrations yet**, not an empty classes calendar. Failed data requests show Retry and retain the exam links.

## 5. PTE Academic dashboard

Proposed destination: `/dashboard/pte` (new exam overview). Keep `/dashboard` as Student Home and update links that currently call it PTE Practice Hub.

Above the fold: breadcrumb **Home / PTE Academic**, heading **PTE Academic**, and four equal skill cards. Each card has a plain icon, full skill name, a short example, an accurate availability/task count and **Explore tasks**. Do not send “View all Speaking” straight into Read Aloud; it must open a real Speaking index.

| Skill | Examples from current source | Proposed index |
|---|---|---|
| Speaking | Read Aloud, Repeat Sentence, Describe Image | `/dashboard/pte/speaking` |
| Writing | Write Essay, Summarize Written Text | `/dashboard/pte/writing` |
| Reading | Reading & Writing Fill in the Blanks, Re-order Paragraphs | `/dashboard/pte/reading` |
| Listening | Write from Dictation, Summarize Spoken Text | `/dashboard/pte/listening` |

Each index shows task rows with full names, one-line descriptions and actual actions. Examples: **Summarize Written Text (SWT)** and **Write from Dictation (WFD)**. Full names come first; abbreviations are supplementary and searchable.

Below the skill cards, show one real Continue practice action and a small recent-results list. Recommendations are optional later; initially use a transparent rule such as recently attempted tasks rather than implying a personalised AI study plan that has not been built. Use practice scores out of 90 where the existing scoring product supports that display; do not change scoring weights or create a new proficiency metric as part of a navigation redesign.

Mock-test entry points appear only for verified working products. Do not invent a complete PTE mock experience merely because a practice-tests route exists.

## 6. IELTS dashboard

Keep `/dashboard/ielts` as the canonical overview. Retain its four skill destinations and dedicated `/dashboard/ielts/mock-tests` route.

Show **Academic / General Training** clearly near the top. This selection affects the relevant content and availability, rather than changing labels while leaving students in the wrong collection. Never relabel Academic passages or Task 1 visual reports as General Training materials.

The four skill cards use the same grid structure as PTE. Based on the current source, the first availability audit should distinguish:

- Listening collections and runners that exist in the dedicated Studio.
- Academic Reading collections/runners.
- Academic Writing collections and the standalone Writing Task 2 tool.
- Speaking, which currently has coming-soon presentation in the Studio.
- General Training collections, which need separate readiness checks; do not infer availability from Academic routes.

Show **Available**, **Coming soon**, **Requires access**, **No questions yet** or **Temporarily unavailable** from one explicit readiness/entitlement source. These states have different meanings. A card marked Coming soon must not have a working-looking Start button leading to another skill.

Mock tests get a distinct, visible entry below the four skill cards. State the actual components included in each mock and its package/credit requirement. Keep result labels such as **Writing practice feedback** and the correct band scale; avoid showing a single incomplete mock average as an official overall IELTS band. Preserve current scoring records and review any scoring-label changes separately.

## 7. Other student areas

| Area | Proposed screen and boundaries |
|---|---|
| Skill/task catalogue | Simple grouped task rows, full names, consistent Start/Resume/View results actions, exam breadcrumbs |
| Question/test list | Search and modest filters appropriate to the task; show true availability, access requirement, and completion only when recorded |
| Active practice | Preserve existing runner; clear exam/task/timer, save/exit protection and accessible media controls; no promotional or seasonal overlays |
| Results list | One place for history, filtered by exam/skill/date; show score scale, processing/error state and Review |
| Result detail | Existing feedback, strengths, next improvement and Practise again; link back to the correct exam/skill, not a generic PTE dashboard |
| My Registrations | Course application, reference, submitted date and actual registration/payment statuses; View registration and Register for a course |
| Registration detail | The submitted course choice, payment/receipt information and support contact; no class entry, lesson timetable or course-content tabs |
| Payments | Keep authoritative existing statuses; distinguish pending, verified/paid, failed and cancelled as supported by the backend; show receipt only where valid |
| Practice credits | Explain which practice product a balance applies to; avoid merging essay, mock and other credit pools unless the backend already does so |
| Help | “Find PTE practice”, “Find IELTS practice”, “Check my registration”, “Payment help”, and existing support route |
| Settings | Name/profile, appearance and exam preference; exam preference does not determine entitlement or hide the other exam |
| Authentication | Return students to their intended exam/task after sign-in; first-time users land on neutral Home or a simple exam-choice step |
| AI tutor | Secondary contextual action only if the current product/permissions support it; not another competing primary dashboard |
| Certificates | Do not advertise lesson completion/certification in the new Home. Retain any existing request route until its business purpose and ownership are confirmed |

Course-delivery pages found in the repository should be hidden from the new student navigation as instructed. Their removal, archival or data migration is a separate decision; do not delete them merely to simplify the menu.

## 8. Visual system and images

Use the existing Smart Labs logo, a neutral light canvas, white bordered cards, deep navy text, blue PTE accents and cranberry IELTS accents. Both exam cards use equal size and button hierarchy. Exam identity always appears in text; colour alone is insufficient.

Use normal readable labels, restrained badges, 16px body copy, clear focus rings, comfortable line heights and at least 44px touch targets. Provide a matching dark mode when implemented; do not copy fixed light backgrounds into text-heavy dark screens. Keep seasonal decoration outside protected student practice areas as in the current theme policy.

Generated mockups are **design concepts**, not implemented pages. All names, scores, fees, references and statuses in them are illustrative. Their typography may simplify or distort small text and their logo symbols may vary; implementation must use the existing Smart Labs logo. This written specification is authoritative for labels and behaviour. In particular, sample amounts are not proposed prices and sample scores do not represent a real learner. Any aggregate practice table requires verified compatible result data before implementation.

The requested concept set:

| File | Purpose |
|---|---|
| `01-student-home.webp` | Two prominent exam entrances with registration/results summaries; no class or resource sections |
| `02-pte-dashboard.webp` | Four PTE skills visible immediately |
| `03-ielts-dashboard.webp` | Four IELTS skills, test-type selector, honest availability and mock entry |
| `04-registrations.webp` | Registration and payment tracking only |
| `05-results-review.webp` | Separate exam score scales and useful feedback action |
| `06-mobile-navigation.webp` | Home/PTE/IELTS mobile layouts and consistent bottom navigation |

`index.html` is a local visual review gallery. Full PNG masters and exact generation prompts are retained under `sources/`. No extra decorative images are needed to make the navigation usable; use the installed icon system and real HTML text in implementation rather than flattening generated mockups into a working interface.

## 9. Search and shared content catalogue

Extend the existing `src/lib/pte-catalog.ts` rather than creating another parallel PTE list. Add a consistent adapter for IELTS readiness and destinations. A navigation/task item should define stable ID, exam ID, skill ID, label, aliases, actual destination, availability and access state.

All dashboard cards, sidebar items, counts, search results and breadcrumbs should consume these adapters. Keep question data and scoring implementations separate. Explicit aliases include RA → Read Aloud, SWT → Summarize Written Text, WFD → Write from Dictation, SST → Summarize Spoken Text, and IELTS Task 2 → Writing Task 2. Searching “Writing” must return exam-labelled groups, not silently choose PTE.

A typed search over this small catalogue is enough for the first release; no generative search service is needed. Prefer clear results such as **IELTS → Writing → Task 2** with the actual destination and availability.

## 10. Route compatibility and implementation boundaries

| Existing route/family | Proposed treatment |
|---|---|
| `/dashboard` | Neutral Student Home |
| New `/dashboard/pte` and skill indices | Add navigation/index pages that link to existing working trainers |
| `/dashboard/practice/*` | Preserve URLs, attempts and runner logic; map them to PTE exam/skill context |
| `/dashboard/ai-score-test*` | Preserve compatibility, then consolidate entry labels and add deliberate redirects only after checking deep links and in-progress attempts |
| Standalone PTE/IELTS writing/listening trainers | Preserve addresses; provide consistent context/back links without introducing a second app shell or moving active attempts |
| `/dashboard/ielts/*` | Keep working destinations and query/track context; unify navigation/readiness |
| `/dashboard/progress` | Keep compatibility; connect to verified results when ready, not another placeholder card |
| Proposed `/dashboard/registrations` | A registration-focused view over the existing authoritative registration/payment records; validate its data source first |
| `/dashboard/support`, `/dashboard/settings` | Keep and improve entry labels; retain existing access controls |
| Existing recordings/schedule/resources links | Remove from the proposed student menu; do not delete routes or underlying data in this phase |

Primary implementation areas: `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`, `src/components/dashboard/`, `src/lib/pte-catalog.ts`, `src/lib/ielts-catalog.ts`, `src/components/ielts/studio.tsx`, relevant standalone trainer context/back links and existing header entry links.

Do not change payment verification, registration workflows, authentication rules, practice credits, scoring prompts/algorithms, stored attempts or existing student data as a side effect of redesigning navigation. This checkout has unrelated local edits; preserve and review them before any implementation work.

## 11. Delivery phases

### Phase 1 — make PTE and IELTS easy to find

Neutral Home, two exam entrances, persistent exam navigation, four-skill overview pages, mobile navigation and consistent breadcrumbs. Remove class-delivery/resource links from the new student shell. Reuse working trainers and existing access checks. This phase directly addresses the complaints and should ship before a reporting redesign.

### Phase 2 — make every destination accurate

Unify catalogue/readiness, remove duplicate cards and stale counts, verify every published task link, add alias search and consistent access/empty states. Verify Academic versus General Training content carefully. Keep deep links working.

### Phase 3 — registrations and results

Add registration-focused tracking over existing data and a unified practice-results adapter. Separate exam scales and practice-product balances. Replace progress placeholders only when real data is available. Do not introduce class delivery.

### Phase 4 — validate and roll out

Pilot with a small student cohort using a reversible rollout flag. Keep the previous dashboard available for rollback while preserving the same attempts/payment records. Broaden after the findability checks pass; monitor support complaints and dead ends.

Planning range, not a delivery commitment: Phase 1 roughly 2–4 focused development days; Phase 2 about 2–3; Phase 3 about 3–5 depending on existing data compatibility; usability/accessibility/regression work another 1–2. Refine this after checking the reporting and registration data model. No date or cost has been approved by this document.

## 12. Acceptance checks

- A first-time student can find PTE and IELTS without opening a menu or scrolling past a long list of the other exam's tasks.
- Every skill is reachable in at most two selections from Home; a known task in at most three. An alias search can shorten this route.
- In a pilot with 5–8 representative students, target at least 90% successful completion of “find PTE Speaking”, “find IELTS Reading”, “review a result” and “check a registration” without assistance. Treat this as a target, not measured evidence.
- Both exam entrances remain discoverable at 360px/390px widths; bottom navigation does not cover buttons, fields or timers.
- PTE and IELTS context, skill names and availability agree across Home, sidebar, search, deep links and result-return actions.
- No My Classes, Join Class, classroom schedule, recordings or Resources items appear in the proposed student navigation or Home.
- Coming-soon actions cannot start unavailable practice; access-required items explain the actual requirement. Empty/failed states remain navigable.
- No placeholder scores, invented streaks, course completion or future classroom activities appear as real student data.
- PTE and IELTS score scales remain distinct; incomplete mock summaries are labelled accurately.
- Existing registration/payment verification, credit deductions, recordings made during practice, scoring, saved attempts and authentication continue to work unchanged.
- Keyboard navigation, focus visibility, accessible names, contrast, zoom/reflow, screen-reader labels and reduced-motion preferences are verified.
- Timed tests and microphone/audio practice remain focused and preserve responses when students leave or change context.
- Use route/catalogue checks and representative end-to-end paths, TypeScript and the production build for implementation. Planning images alone do not establish functional readiness.

Collect only minimal product events needed to assess findability, such as exam entry, skill entry and broken destination. Do not log essays, microphone recordings or personal payment details into navigation analytics.

## 13. Decisions for implementation

The recommended direction is the neutral Home plus separate exam dashboards shown in this package. Before building, confirm which registration record is authoritative, which IELTS collections are ready for each test type, which result sources can be shown together without mixing scales, and which practice credit/access messages are accurate.

The owner's correction is already settled: **no resources or class-delivery features in the redesigned student area**. No further confirmation is needed to apply that constraint to the designs. Live implementation and deployment are outside this planning request.
