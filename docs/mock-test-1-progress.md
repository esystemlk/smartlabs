# PTE Mock Test 1 — question collection progress

Source of truth for the question counts: `mock exam PTE structure.docx` (Pearson's
published 65-question reference structure, adapted per task-type overrides below).

Each task type's questions are stored in Firestore (`pte_questions`, `active: false`
so they never appear in regular student practice — only the admin mock-test builder
at `/admin/dashboard/mock-tests` can see and select them) via `scripts/add-mock-questions.cjs`,
fed from the raw batch files under `mock-data/mock-1/`.

Question collection and Firebase verification are complete. The full 66-question
runner, background assessment, separate mock-credit gate, and diagnostic report
are implemented; see the implementation and setup notes below. Live AI testing
is deferred until the user configures the dedicated mock key 6.

## Speaking & Writing — 9 types, target 35 (this mock uses 5 Read Aloud, not 6 — see note)

| # | Task | Target | Received | Firestore batch file | Status |
|---|---|---|---|---|---|
| 1 | Read Aloud | 5 (real exam varies 5–6; this mock uses 5) | 5 | `mock-data/mock-1/read-aloud.json` | ✅ done |
| 2 | Repeat Sentence | 10 | 10 | `mock-data/mock-1/repeat-sentence.json` | ✅ done |
| 3 | Describe Image | 5 | 5 | `mock-data/mock-1/describe-image.json` | ✅ done |
| 4 | Retell Lecture | 3 (real exam target 2; this mock uses 3 per your count) | 3 | `mock-data/mock-1/retell-lecture.json` | ✅ done |
| 5 | Answer Short Question | 5 | 5 | `mock-data/mock-1/answer-short-question.json` | ✅ done |
| 6 | Summarize Group Discussion | 2 | 2 | `mock-data/mock-1/summarize-group-discussion.json` | ✅ done |
| 7 | Respond to a Situation | 2 | 2 | `mock-data/mock-1/respond-to-situation.json` | ✅ done |
| 8 | Summarize Written Text | 2 | 2 | `mock-data/mock-1/summarize-written-text.json` | ✅ done |
| 9 | Write Essay | 1 | 1 | `mock-data/mock-1/write-essay.json` | ✅ done |

## Reading — 5 types, target 15 (now 16 — Drag & Drop uses 5 instead of 4, per your override)

| # | Task | Target | Received | Status |
|---|---|---|---|---|
| 10 | Fill in the Blanks – Dropdown | 5 | 5 | ✅ done |
| 11 | Multiple Choice, Multiple Answers | 2 | 2 | ✅ done |
| 12 | Reorder Paragraphs | 2 | 2 | ✅ done |
| 13 | Fill in the Blanks – Drag & Drop | 5 (real exam target 4; this mock uses 5 per your count) | 5 | ✅ done |
| 14 | Multiple Choice, Single Answer | 2 | 2 | ✅ done |

## Listening — 8 types, target 15

| # | Task | Target | Received | Status |
|---|---|---|---|---|
| 15 | Summarize Spoken Text | 1 | 1 | ✅ done |
| 16 | Multiple Choice, Multiple Answers | 2 | 2 | ✅ done |
| 17 | Fill in the Blanks – Type In | 2 | 2 | ✅ done |
| 18 | Highlight Correct Summary | 2 | 2 | ✅ done |
| 19 | Multiple Choice, Single Answer | 2 | 2 | ✅ done |
| 20 | Select Missing Word | 1 | 1 | ✅ done |
| 21 | Highlight Incorrect Words | 2 | 2 | ✅ done |
| 22 | Write from Dictation | 3 | 3 | ✅ complete and Firebase verified |

---

## Read Aloud — the 5 questions received

1. "The Royal Institution is an organization that has been around for 209 years. Many of the people that have worked here have been scientists themselves, including Michael Faraday. He made the discoveries that made generating and using electricity much easier, making it possible for us all to switch on lights, cook our dinner, play games consoles much, much more."
2. "In spite of the spectacularly high quality of life for the vast majority of the people who live in the European Union, its inhabitants seem obsessed by the region's relative decline in the world. Slow economic growth rates and high unemployment have reinforced the impression that Europe is unhappy with today and unsure of tomorrow."
3. "Aquaculture, also known as aquafarming, is the farming of aquatic organisms such as fish, crustaceans, molluscs and aquatic plants. Aquaculture involves cultivating freshwater and saltwater populations under controlled conditions."
4. "Your tutor helps you make the most of your time at university by giving you guidance and support along the way. All new students are allocated a personal tutor who will encourage you to get the most out of your course, direct you to other sources of support and help you achieve your goals."
5. "Statistics are indicators of change and allow meaningful comparisons to be made. While it may be the issues rather than the statistics as such that grab people's attention, it should be recognized that it is the statistics that informed the issues. Statistical literacy, then, is the ability to accurately understand, interpret and evaluate the data that inform these issues."

Stored in Firestore as `pte_questions/read-aloud__mock1-1` through `mock1-5`,
`category: "mock-1"`, `active: false`.

## Repeat Sentence — the 10 audio files received

Original mp3s uploaded to Firebase Storage (`repeat-sentence/` prefix) and
referenced via `audioUrl` on `pte_questions/repeat-sentence__mock1-1` through
`mock1-10`. No text transcript was provided or generated — these questions
carry **only the reference audio**, no reference text.

**Scoring integration:** the current `scorePteSpeaking` flow
for `repeat-sentence` expects a text reference (`promptText`) to compare the
student's response against, the same pattern the describe-image fix now uses
real images for. The full mock prepares and caches text transcripts from these
10 reference recordings using its dedicated key 6, then passes that reference
to the existing speaking scorer. The individual scorer's marking rules are unchanged.

## Describe Image — the 5 images received

1. "Out of sight, out of mind" — infographic on the Pacific Ocean garbage patches (plastic waste vortex, North Pacific Gyre currents, Eastern/Western Garbage Patch, cross-section to 10m depth).
2. Bar chart — "Benefit Recipient by Health Area in Sydney, 2004": Age Pension vs Disability Pension, two regions (Sydney South West, South Eastern Sydney & Illawarra).
3. World map — "Share of World GDP PPP 2011, World Bank, ICP": countries shaded by GDP share band, six biggest economies marked, pie chart insert.
4. Circular 6-step process diagram: State the Problem → Generate Ideas → Select a Solution → Build the Item → Evaluate → Present Results.
5. Grouped bar chart — "Cups of Coffee Sold": Downtown vs Mall, Jan–May.

Uploaded to Firebase Storage (`describe-image/` prefix) and referenced via
`imageUrl` on `pte_questions/describe-image__mock1-1` through `mock1-5`, each
with a short `describe` reference note (used only as a hint — the AI scorer
analyses the actual attached image as ground truth, per the earlier
Describe Image fix).

## Retell Lecture — 3 of 3 received ✅

1. ✅ "Sales compensation plans" (straight salary / salary + commission / commission-only) — audio uploaded to Firebase Storage (`retell-lecture/` prefix), full transcript stored, `pte_questions/retell-lecture__mock1-1`.
2. ✅ "Wage, consumption and debt" — audio + transcript stored, `pte_questions/retell-lecture__mock1-2`.
3. ✅ "Facial recognition" (how humans recognize faces) — audio + transcript stored, `pte_questions/retell-lecture__mock1-3`.

## Answer Short Question — 5 of 5 received ✅

1. ✅ "What do we call the organs in our chest that we use to breathe?" — Answer: Lungs / lung. Audio + question text + correct answer stored, `pte_questions/answer-short-question__mock1-1`.
2. ✅ "What do you call the very long essay that students have to write for a doctoral degree?" — Answer: Thesis / dissertation / discourse / paper. `pte_questions/answer-short-question__mock1-2`.
3. ✅ "Where do people usually go to deposit money?" — Answer: Bank. `pte_questions/answer-short-question__mock1-3`.
4. ✅ "What is the word for a period of one hundred years?" — Answer: Century. `pte_questions/answer-short-question__mock1-4`.
5. ✅ "What is the job of someone that looks after your teeth and gums?" — Answer: Dentist / surgeon dentist. `pte_questions/answer-short-question__mock1-5`.

## Summarize Group Discussion — 2 of 2 received ✅

1. ✅ "Online classes" — three students debating online vs in-person classes. Audio + full transcript stored, `pte_questions/summarize-group-discussion__mock1-1`.
2. ✅ "University bookshop closing" — three students discussing e-books vs physical books and why the campus bookshop closed. Audio + full transcript stored, `pte_questions/summarize-group-discussion__mock1-2`.

## Respond to a Situation — 2 of 2 received ✅

1. ✅ "Fallen tree blocks road" — presentation rescheduling situation. Audio + question + a sample answer stored, `pte_questions/respond-to-situation__mock1-1`.
2. ✅ "Wrong exam time" — correcting a friend about an exam time mix-up. Audio + question + a sample answer stored, `pte_questions/respond-to-situation__mock1-2`.

**Note from you (applies to both):** the sample answer is a reference for the
AI only — students are not expected to match it word-for-word, just achieve
the same communication goal. Stored as `sampleAnswerNote` on each question
doc for when the scoring flow is built.

## Summarize Written Text — 2 of 2 received ✅

1. ✅ "Small wars / unconventional warfare" — passage + sample one-sentence summary stored, `pte_questions/swt__mock1-1` (`section: writing`, `taskType: swt`, text-only, no media upload needed).
2. ✅ "History of summer vacation" — passage + sample one-sentence summary stored, `pte_questions/swt__mock1-2`.

## Write Essay — 1 of 1 received ✅

1. ✅ "What are the problems and the benefits for high school students of studying plays and other works for theatre that were written centuries ago? Use your own experience to discuss it." — topic text stored, `pte_questions/write-essay__mock1-1` (`section: writing`, text-only, no sample answer given — essay scoring is rubric-based, not comparison-based).

**SPEAKING & WRITING SECTION COMPLETE — 35/35 questions received.**

---

## Reading — Fill in the Blanks (Dropdown) — 5 of 5 received ✅

1. ✅ "Burger King" passage — 6 dropdown blanks, each with 4 options and a correct answer verified from your screenshots: claiming, contenders, attributed, rectified, importance, reliable. Stored as `pte_questions/rw-fill-blanks__mock1-1` (`section: reading`, `taskType: rw-fill-blanks`, text-only).
2. ✅ "Good Schools Guide" passage — 4 dropdown blanks, answers verified from your results screenshot: downturn, popular, Explaining, sector. Stored as `pte_questions/rw-fill-blanks__mock1-2`.
3. ✅ "Fear of conflict" passage — 5 dropdown blanks, answers verified from your results screenshot: scared, risk, damaged, express, real. Stored as `pte_questions/rw-fill-blanks__mock1-3`.
4. ✅ "Teenage sleep patterns" passage — 5 dropdown blanks, answers verified from your results screenshot: soundly, influenced, erratic, Despite, insufficient. Stored as `pte_questions/rw-fill-blanks__mock1-4`.
5. ✅ "Origin of music / motherese" passage — 4 dropdown blanks, answers verified from your results screenshot: reflects, leading, adopt, ensure. Stored as `pte_questions/rw-fill-blanks__mock1-5`.

## Reading — Multiple Choice, Multiple Answers — 2 of 2 received ✅

1. ✅ "Snap judgments / decision making" passage — 5 options, 2 correct answers verified from your highlighted screenshot (A, B). Stored as `pte_questions/mcq-multiple__mock1-1` (`section: reading`, `taskType: mcq-multiple`, text-only).
2. ✅ "11th century Europe: north vs south" passage — 4 options, 2 correct answers verified from your highlighted screenshot (C, D). Stored as `pte_questions/mcq-multiple__mock1-2`.

## Reading — Reorder Paragraphs — 2 of 2 received ✅

1. ✅ "False memories" — 4 paragraphs, correct order 1, 3, 2, 4 per your answer. Stored in that order, `pte_questions/reorder-paragraphs__mock1-1` (`section: reading`, text-only).
2. ✅ "Plant and Protein" — 4 paragraphs, correct order 1, 3, 2, 4 per your screenshot. Stored in that order, `pte_questions/reorder-paragraphs__mock1-2`.

## Reading — Fill in the Blanks (Drag & Drop) — 5 of 5 received ✅ (target overridden 4→5, same pattern as Read Aloud/Retell Lecture)

1. ✅ "Cuteness in offspring" passage — 4 blanks, word bank of 9 (4 correct + 5 distractors) verified from your screenshot: correct = potent, ensures, dependent, instinctive. Stored as `pte_questions/fill-blanks__mock1-1` (`section: reading`, `taskType: fill-blanks`, text-only).
2. ✅ "Colorful Poison Frogs" passage — 5 blanks: diversity, major, reservoirs, counter, tropical. Stored as `pte_questions/fill-blanks__mock1-2`.
3. ✅ "Children Skip School" passage — 5 blanks: fewer, played, hardcore, period, agreed. Stored as `pte_questions/fill-blanks__mock1-3`.
4. ✅ "United Nations" passage — 4 blanks: including, observed, engages, influence. Stored as `pte_questions/fill-blanks__mock1-4`.
5. ✅ "Sports" passage — 4 blanks: tightly, recreational, originally, attracting. Stored as `pte_questions/fill-blanks__mock1-5`.

## Reading — Multiple Choice, Single Answer — 2 of 2 received ✅

1. ✅ "Flies and Mosquitos" passage — 4 options, correct answer C ("can do more processing than a supercomputer"). Stored as `pte_questions/reading-mcq-single__mock1-1` (`section: reading`, `taskType: reading-mcq-single`, text-only).
2. ✅ "Packet-switching network" passage — 4 options, correct answer A ("The receiving computer can determine whether or not the package is intact all by itself"). Stored as `pte_questions/reading-mcq-single__mock1-2`.

**READING SECTION COMPLETE — 16/16 questions received** (target overridden from 15 to 16: Drag & Drop uses 5 instead of 4, per your count).

---

## Listening — Summarize Spoken Text — 1 of 1 received ✅

1. ✅ "Washing fruits and vegetables" — audio + full transcript + sample 50-70 word summary stored, `pte_questions/summarize-spoken-text__mock1-1` (`section: listening`, `taskType: summarize-spoken-text`).

## Listening — Multiple Choice, Multiple Answers — 2 of 2 received ✅

1. ✅ "Time Famine" — audio + transcript, 5 options, 2 correct answers verified from your screenshots (B, D — hiring dog walker, hiring babysitter). Stored as `pte_questions/listening-mcq-multiple__mock1-1` (`section: listening`, `taskType: listening-mcq-multiple`).
2. ✅ "Negotiation" — audio + transcript, 5 options, 3 correct answers verified from your screenshot (A, C, D). Stored as `pte_questions/listening-mcq-multiple__mock1-2`.

## Listening — Fill in the Blanks (Type In) — 2 of 2 received ✅

1. ✅ "STEM Internship Support" — audio + 4-blank transcript, answers verified from your screenshot: subsidies, average, placement, experience. Stored as `pte_questions/listening-fill-blanks__mock1-1` (`section: listening`, `taskType: listening-fill-blanks`).
2. ✅ "Driving License Test Preparation" — audio + 4-blank transcript, answers verified from your screenshot: busy, instructor, requiring, ability. Stored as `pte_questions/listening-fill-blanks__mock1-2`.

## Listening — Highlight Correct Summary — 2 of 2 received ✅

1. ✅ "Romance" — audio + transcript, 4 candidate summaries, correct answer A verified from your screenshot. Stored as `pte_questions/highlight-correct-summary__mock1-1` (`section: listening`, `taskType: highlight-correct-summary`).
2. ✅ "Friendship" — audio + transcript, 4 candidate summaries, correct answer B verified from your screenshot. Stored as `pte_questions/highlight-correct-summary__mock1-2`.

## Listening — Multiple Choice, Single Answer — 2 of 2 received ✅

1. ✅ "Isolation" — audio + transcript, 4 options, correct answer B verified from your screenshot. Stored as `pte_questions/listening-mcq-single__mock1-1` (`section: listening`, `taskType: listening-mcq-single`).
2. ✅ "US Political Parties" — audio + transcript, 4 options, correct answer D verified from your screenshot. Stored as `pte_questions/listening-mcq-single__mock1-2`.

## Listening — Select Missing Word — 1 of 1 received ✅

1. ✅ "Triggers" — audio + text up to the beep, 4 options, correct answer A ("a victim") verified from your screenshot. Stored as `pte_questions/select-missing-word__mock1-1` (`section: listening`, `taskType: select-missing-word`).

## Listening — Highlight Incorrect Words — 2 of 2 received ✅

1. ✅ "Dramatic Changes" — audio + displayed transcript (word array) + audio-matching text, 5 incorrect words verified from your screenshot: populations, diseases,, ecosystems, places, production. Stored as `pte_questions/highlight-incorrect-words__mock1-1` (`section: listening`, `taskType: highlight-incorrect-words`).
2. ✅ "Archery" — same format, 6 incorrect words verified from your screenshot: major, continuously, featured, militias, farthest, bar. Stored as `pte_questions/highlight-incorrect-words__mock1-2`.

## Listening — Write from Dictation — 3 of 3 received

1. ✅ "Before choosing your university courses, you should consider your future career." Audio + sentence text verified from your screenshot. Stored as `pte_questions/write-from-dictation__mock1-1` (`section: listening`, `taskType: write-from-dictation`).
2. ✅ "We no longer respond to any postal reference requests." Audio + sentence text verified from your screenshot. Stored as `pte_questions/write-from-dictation__mock1-2`.
3. ✅ "His analysis study appears to be based on the false premise." Present in the local batch with `WFD3.mp3`, stored as `pte_questions/write-from-dictation__mock1-3`. Independently verified against Firebase.

## Codex handoff audit — 23 October 2026

- All 22 task-type batches parse successfully: **66 questions total** (35 Speaking & Writing, 16 Reading, 15 Listening). The earlier 65-question total does not include the extra Reading Drag & Drop question.
- All local media paths in the manifests exist, including the final dictation audio.
- Added a read-only audit: `node scripts/verify-mock-questions.cjs`. It compares Firestore fields and nested question data, checks media download tokens, and compares uploaded media bytes with local originals.
- Independent Firebase verification **passed** after enabling network access: **66 expected / 66 Firestore records; 42 media files verified; all 42 byte-identical; zero issues**. No question records were changed by this audit.
- The legacy eight-question Writing mock remains available. The full mock now has its own runner at `/mock/full-1` and API at `/api/full-mock`.

## Full mock implementation

- Approved by the user: use all 66 collected questions; use 0.5% for the three published `<1%` Overall weights and normalize each weighting column.
- Existing individual AI scoring flows and marking rules are unchanged. The mock calls the existing essay/SWT/SST routes internally (trainer credit bypass) and the existing speaking flow directly. Existing WFD marking is reused. Only the aggregation layer is new.
- Full mock AI requests use **`GOOGLE_GENAI_API_KEY_6` exclusively**, including reference transcription and background scoring. Request-local `AsyncLocalStorage` context selects this key in the existing AI transports without changing rubrics or global environment values. Individual practice requests retain their original keys 1–5. Mock requests never fall back to those keys; usage logs identify `KEY_6`.
- Missing Repeat Sentence reference transcripts are prepared from the reference audio and cached separately. This prepares input for the existing speaking scorer without changing its rubric.
- One mock credit is deducted atomically with attempt creation. Repeated/concurrent Start calls resume the same unfinished attempt. No essay, speaking, SWT, SST, or universal AI credit pools are charged.
- Completed responses are assessed in the background through awaited requests with an attempt-wide scoring lease. Scores are cached per response and retried without another debit. Results require all 66 response assessments; failed assessments are never silently dropped from the totals.
- Preparation flow: overview, instructions, headphone test, microphone record/playback with live level meter, tips, unscored timed introduction (25 seconds preparation / 30 seconds recording), ready screen.
- Timings for this practice exam: Speaking & Writing up to 84 minutes, Reading 30 minutes, Listening 43 minutes. Writing tasks and speaking tasks have their own response limits; Reading and remaining Listening tasks share section clocks. Timers are stored on the server and continue after exit.
- Student report: five independent practice estimates, eight Skills Profile categories, task-level performance, question-by-question reference/response comparison, recordings, unchanged scorer feedback, and lecturer notes.
- Lecturer review: `/admin/dashboard/full-mocks`; review links require the attempt owner or an authenticated staff role. Answer keys are withheld during an active attempt. Reorder Paragraph IDs are opaque and shuffled per attempt.
- Scores are explicitly labelled estimates: the supplied Pearson scoring PDF explains that its difficulty calibration and scaling algorithm are proprietary and cannot be reconstructed from the average weighting table.
- Live AI verification is pending configuration of key 6 in `.env.local`. Starting a new attempt is blocked before any credit debit when that key is absent. No secret key is stored in source code or sent to the browser.
- Automated verification: 34 tests passed, covering credit concurrency, full 66-question completion, score preservation, ownership, lecturer notes, retries, and concurrent isolation of key 6 from individual practice. The final production build and TypeScript checks passed with the dedicated-key transport change. Live AI and a complete authenticated microphone/browser run remain deferred until key 6 is configured, as requested by the user.

Write from Dictation uses its supplied sentence references with the existing
deterministic WFD scorer, without an AI call.
