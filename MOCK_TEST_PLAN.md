# Writing Mock Test — Implementation Plan

**Status:** Plan only — no code written yet.
**Scope:** One timed mock exam chaining the four AI trainers we already built (SWT, Write Essay, SST, Write From Dictation), plus an admin builder to pick which questions go in it.

---

## 1. What we're building

A single, continuous, timed exam that mirrors the real PTE test experience:

| # | Task | Questions | Time each | Section total |
|---|------|-----------|-----------|---------------|
| 1 | Summarize Written Text | 2 | 10:00 | 20:00 |
| 2 | Write Essay | 1 | 20:00 | 20:00 |
| 3 | Summarize Spoken Text | 1 | 10:00 | 10:00 |
| 4 | Write From Dictation | 4 | 1:00 | 4:00 |
| | **Total** | **8** | | **54:00** |

When a question's timer hits `0:00` the app **saves whatever is currently typed** (even if the student never pressed Next) and moves on automatically — exactly like the real exam. At the end, all 8 answers are scored through our existing AI engines and combined into one report.

### Accuracy note (worth knowing)
In the **real** PTE Academic, only SWT and Essay are in the Writing section ([Pearson — Speaking & Writing format](https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/)); SST and WFD sit in the **Listening** section ([Pearson — Listening format](https://www.pearsonpte.com/pte-academic/test-format/listening/)) and contribute to *both* Listening and Writing scores. Our mock deliberately groups all four **typed-response** tasks together because those are the four we can auto-score. That's a legitimate product decision, but it means the result should be labelled **"Smart Labs Writing Mock"** — not an official PTE Writing score. The per-task bands are directly comparable to real PTE; the combined figure is our own weighting (§7).

---

## 2. Timing rules (exact behaviour)

Per question, a countdown runs. Three things happen automatically:

| Trigger | Behaviour |
|---|---|
| **2:00 remaining** | Timer turns amber, subtle pulse. No interruption, no modal. |
| **0:30 remaining** | Timer turns red. |
| **0:00** | Current text is force-saved and the app advances to the next question. No confirmation dialog. |

The student can also press **Next** early — the remaining time is **forfeited** (real exam behaviour; time does not roll over).

> **Open decision A — the "120" in your brief.** I read this as a *2-minute warning*. If you instead meant something else (e.g. "the last 120 seconds are locked"), tell me and I'll change it. Default as planned: warning only, no lock.

### Audio playback (SST & WFD)
The real exam plays each recording **once**. Our standalone WFD trainer currently allows 3 plays — that's correct for practice, wrong for a mock.

- **In the mock:** SST audio plays **once**, auto-starting after a 3-second "Get ready" countdown. WFD audio plays **once** per item, same 3-second lead-in.
- The play button is disabled after playback ends. This is the single biggest realism difference from our practice trainers.

> **Open decision B:** confirm 1 play (exam-real) vs. keeping 3 plays (friendlier). Default as planned: **1 play**.

---

## 3. UI design (exam-realistic)

Modelled on the real PTE interface and the conventions APEUni's mock uses ([APEUni mock overview](https://www.apeuni.com/blog/pte_mock_introduction_en?locale=en)).

```
┌──────────────────────────────────────────────────────────────┐
│  Smart Labs Mock              Question 3 of 8      ⏱ 08:42   │  ← fixed top bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ Task instructions — one short paragraph, grey box ]       │
│                                                              │
│  [ Passage / audio player / essay prompt ]                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ answer textarea                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  Word count: 47            [Cut] [Copy] [Paste]              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                              [   Next   ]    │  ← bottom bar
└──────────────────────────────────────────────────────────────┘
```

Deliberate choices, all matching the real test:

- **No site header, footer, cookie banner, accessibility widget or chat** — the mock renders on a bare shell. (Same technique already used for `/site-status`.)
- **No back button.** You cannot return to a previous question.
- **Cut / Copy / Paste buttons** — the real PTE provides these instead of relying on keyboard shortcuts, and APEUni replicates them.
- **Live word counter** under every textarea (required for SWT 5–75, SST 50–70, Essay 200–300).
- **Progress dots** (8 dots, current highlighted) so the student knows where they are.
- **Timer never hidden** — fixed top-right, monospace digits so it doesn't jitter.
- **Full-bleed, distraction-free**: one question on screen, generous whitespace, no marketing chrome.
- **Mobile**: the same layout stacks vertically; textarea gets `min-height: 40vh`. Mock is usable on phone but we show a one-time "a laptop is recommended" notice.

### Screens outside the question flow
1. **Intro / rules** — structure table, total time, "audio plays once", "you cannot go back", Start button.
2. **Section transition card** — 5-second interstitial between task types ("Next: Write Essay — 1 question, 20 minutes").
3. **Scoring screen** — the existing `WalkingLoader` (`public/walking.json`, already used on the essay page) with live progress: *"Scoring 3 of 8…"*.
4. **Results** — overall band + per-task breakdown, reusing our existing result components.

---

## 4. Security — server-authoritative timing

A client-side timer alone is trivially bypassed (edit `state`, freeze the clock, replay requests). Every rule below is enforced on the **server**.

| Risk | Mitigation |
|---|---|
| Student edits the timer / gets unlimited time | Attempt is created server-side with `startedAt` (server timestamp) and a computed **deadline per question**. Every answer submission is checked against the server clock. Late answers are accepted but flagged `lateSubmission: true` and the question is marked accordingly. |
| Student reads the SST/WFD transcript from devtools | Transcripts are **never** sent to the client. WFD already does this (`/api/wfd/questions` strips `content`); the mock endpoint applies the same rule to SST. Scoring resolves transcripts server-side by question ID. |
| Student replays the scoring endpoint to fish for a better score | An attempt can be scored **once**. `status` transitions `in_progress → submitted → scored` inside a Firestore transaction; a second attempt returns the stored result. |
| Student refreshes to reset a question timer | Deadlines are absolute timestamps stored on the attempt, not durations. Refreshing restores the same deadline. |
| Student opens the mock twice in two tabs | One `in_progress` attempt per user per mock; the second tab resumes the same attempt rather than starting a fresh one. |
| Answers lost on crash/refresh | Autosave (§5). |
| Someone reads another student's attempt | Firestore rules: `mock_attempts` readable only by owner or staff; **writable only by the server** (Admin SDK). |

**Anti-cheat telemetry (recorded, not enforced):** tab-blur count, paste events, and typing-burst detection are logged per question so staff can spot obvious copy-paste. We do *not* auto-fail anyone on this — false positives would be worse than the cheating.

---

## 5. Autosave & resume

- Answer text is saved to the attempt **every 5 seconds while typing** (debounced) and again on `blur`, on `visibilitychange`, and on question advance.
- Uses `navigator.sendBeacon` for the unload path so a closed tab still flushes the last answer.
- On reload mid-test, the student resumes at the correct question with their text intact and the **original deadline** (no free time).
- If the whole section's deadline has already passed while they were away, the attempt auto-advances to where it should be.

This is what makes "auto-advance saves partial answers" actually reliable rather than best-effort.

---

## 6. Data model (Firestore)

### `mock_tests` — the exam definitions (admin-authored)
```ts
{
  id, title,                    // "Writing Mock Test 1"
  description?, active: boolean,
  sections: [
    { taskType: 'swt',                  questionIds: [id, id], secondsPerQuestion: 600 },
    { taskType: 'write-essay',          questionIds: [id],     secondsPerQuestion: 1200 },
    { taskType: 'summarize-spoken-text',questionIds: [id],     secondsPerQuestion: 600 },
    { taskType: 'write-from-dictation', questionIds: [id×4],   secondsPerQuestion: 60  },
  ],
  createdAt, updatedAt, createdBy
}
```
Question IDs reference the **existing** `pte_questions` bank — no duplication.

### `mock_attempts` — one per student per sitting
```ts
{
  id, mockId, userId, userEmail, userName,
  status: 'in_progress' | 'submitted' | 'scored' | 'abandoned',
  startedAt, expiresAt,
  currentIndex: number,                 // 0-7
  questions: [{
    questionId, taskType, order,
    deadlineAt,                         // absolute, server-set
    answer: string,                     // autosaved
    answeredAt?, lateSubmission?: boolean,
    // telemetry
    blurCount?: number, pasteCount?: number,
  }],
  scores?: { ...per-task results... },
  overall?: { band, label, perTask[] },
  scoredAt?
}
```
**Writes are server-only.** The client never writes an attempt directly.

### Firestore rules to add
```
match /mock_tests/{id} {
  allow read: if isAuthed();          // students need to see available mocks
  allow write: if isStaff();
}
match /mock_attempts/{id} {
  allow read: if isStaff() || (isAuthed() && resource.data.userId == request.auth.uid);
  allow write: if false;              // Admin SDK only
}
```

---

## 7. Scoring & marking scheme

### Per-task engines (all already built and tested)

| Task | Engine | Raw max | Traits |
|---|---|---|---|
| SWT | `/api/score-swt` | **9** | Content 4, Form 1, Grammar 2, Vocabulary 2 |
| Essay | `/api/score-essay` | **26** | Content 6, Form 2, DSC 6, Linguistic Range 6, Vocab 2, Grammar 2, Spelling 2 |
| SST | `/api/score-sst` | **12** | Content 4, Form 2, Grammar 2, Vocabulary 2, Spelling 2 |
| WFD | `/lib/wfd-scoring` | **% accuracy** | Correct-word ratio (deterministic, 37/37 tests passing) |

These match the publicly documented Pearson traits — SST is scored on content, form, grammar, vocabulary and spelling ([Pearson score guide](https://www.pearsonpte.com/ctf-assets/yqwtwibiobs4/5Sz9Ur4qbus8AEOQdetkAj/69f6c1f2e2870980740b10a2ea9b467f/pte-academic-test-taker-score-guide-nov-2024-v4.pdf)), and WFD is scored purely on correct words in sequence with no penalty for extra words ([thePTE](https://thepte.com/how-write-from-dictation-is-marked/)).

### Combining into one band
Each task is normalised to a percentage, then weighted. Proposed default weights reflect how much each task contributes to a real Writing score and how long it takes:

| Task | Count | Weight each | Weight total |
|---|---|---|---|
| Write Essay | 1 | 35% | **35%** |
| SWT | 2 | 15% | **30%** |
| SST | 1 | 20% | **20%** |
| WFD | 4 | 3.75% | **15%** |

```
overallBand = round( Σ (taskPercent × weight) / 100 × 90 )
```
Reported as a **0–90 band** with the same labels the essay scorer already uses (Expert / Advanced / Upper Intermediate / Intermediate / Developing).

The report shows **both**: the combined band *and* every individual task's own score in its native scale, so students can see exactly where marks were lost.

> **Open decision C:** confirm these weights, or give me the split you want. They're easy to change — one constant.

### Scoring pipeline
1. On submit (or final timeout), attempt → `submitted`.
2. Server scores in **parallel**: 4 AI calls (2×SWT, 1×Essay, 1×SST) + 4 instant WFD computations.
3. Each AI call already has model fallback + retry (`gemini-2.5-flash → gemini-2.5-pro`, 2 retries each).
4. **Partial-failure handling:** if one task fails after all retries, the mock still completes — that task is marked `scoreFailed` with a "retry scoring" button, and the overall band is computed from the tasks that succeeded (clearly labelled as such). The student never loses their whole mock because one API call failed.
5. Attempt → `scored`, results stored permanently.

Expected total scoring time: **15–40 seconds** (AI calls run concurrently). The `WalkingLoader` shows real progress, not a fake bar.

---

## 8. Admin — building a mock

New page: `/admin/dashboard/mock-tests`

- **List** existing mocks with status (Active / Draft), question count, and how many students have attempted them.
- **Builder**: for each of the four slots, a picker that lists questions from the existing bank filtered by `taskType`, showing title + a content preview. Admin selects exactly 2 / 1 / 1 / 4.
- **Validation before publish** — the mock cannot be set Active until:
  - every slot has the required number of questions,
  - every SST and WFD question has an `audioUrl` (otherwise the student hits a silent question),
  - no question is used twice in the same mock.
- **Reorder** questions within a slot (drag or up/down).
- **Duplicate mock** — clone an existing mock as a starting point for the next one.
- **Attempts view** — per mock: who sat it, their band, and a link to the full report.

Staff-gated with the existing `verifyStaff` helper.

---

## 9. Files to create

```
src/types/mock-test.ts                       types + weights + timing constants
src/lib/services/mock-tests.service.ts       client reads (definitions only)

src/app/api/mock/start/route.ts              create/resume attempt, return Q1 (no answers/transcripts)
src/app/api/mock/save/route.ts               autosave answer (debounced client)
src/app/api/mock/advance/route.ts            confirm/auto-advance, returns next question
src/app/api/mock/submit/route.ts             finalise + run scoring pipeline
src/app/api/mock/attempt/[id]/route.ts       fetch results

src/app/mock/[mockId]/page.tsx               the exam runner (bare shell)
src/components/mock/MockTimer.tsx            countdown + warning states
src/components/mock/MockQuestion.tsx         renders the right task UI
src/components/mock/MockScoring.tsx          WalkingLoader + live progress
src/components/mock/MockResults.tsx          overall band + per-task breakdown

src/app/admin/dashboard/mock-tests/page.tsx  builder + list
src/app/api/admin/mock-tests/route.ts        staff CRUD
```

Plus small edits: hide site chrome on `/mock/*` (header, footer, layout-manager, layout-extras), add the two Firestore rules, and add a "Mock Tests" entry to the student dashboard.

---

## 10. Preventing the bugs you're worried about

You asked for this without bugs, glitches or failures. These are the specific things that break timed exams, and how each is handled:

| Failure mode | Prevention |
|---|---|
| Timer drifts (`setInterval` loses time in background tabs) | Compute remaining time from `deadlineAt - serverNow` on every tick; never decrement a counter. Re-sync on `visibilitychange`. |
| Double auto-advance (timer fires while Next is pressed) | Advance is idempotent and guarded by `currentIndex` — server ignores an advance for an index that has already moved on. |
| Answer lost at the moment of auto-advance | Text is flushed *before* the advance request, and the advance request also carries the final text as a fallback. |
| Clock skew between student's device and server | `/api/mock/start` returns `serverNow`; the client stores the offset and uses corrected time everywhere. |
| Refresh grants extra time | Deadlines are absolute timestamps, restored from the attempt. |
| One AI failure kills the whole mock | Per-task failure isolation + retry (§7.4). |
| Scoring runs twice / double-charges | Transaction-guarded status; second call returns the stored result. |
| Audio doesn't load → question unanswerable | Admin validation blocks publishing without audio; at runtime, a failed audio load pauses the timer and shows a retry (logged for staff). |
| Student in a mode-locked site can't finish | `/mock/*` is *not* on the middleware allow-list — starting a mock during maintenance is correctly blocked. |

**Testing before release:** unit tests for the timer/deadline math and score aggregation (same style as the 37 WFD tests), plus one full end-to-end run through all 8 questions with deliberate timeouts on 2 of them.

---

## 11. Decisions I need from you

| # | Question | My default if you don't specify |
|---|---|---|
| **A** | The "120" — 2-minute warning, or something else? | 2-minute amber warning, no lock |
| **B** | Audio plays: 1 (exam-real) or 3 (friendly)? | **1 play** |
| **C** | Score weights (§7) | Essay 35 / SWT 30 / SST 20 / WFD 15 |
| **D** | **Credits.** SWT, Essay and SST scorers each deduct a credit today. One mock = 2 SWT + 1 Essay + 1 SST credits. Options: (a) consume existing credits, (b) a separate "mock credit" pool with its own price, (c) free/unlimited. | **(b)** a separate mock pool — cleanest, and lets you price mocks properly |
| **E** | Can a student retake the same mock? | Yes, unlimited, each attempt stored separately |

**D is the important one** — it decides whether the mock has its own purchase flow, which affects the payment endpoints and the admin UI.

---

## 12. Build order

1. Types, constants, Firestore rules
2. Admin builder (so you can create Mock 1 with real questions immediately)
3. Attempt APIs (start / save / advance) + timer math **with unit tests**
4. Exam runner UI, one task type at a time (SWT → Essay → SST → WFD)
5. Scoring pipeline + results screen
6. Full end-to-end run, then hand over for your review

Roughly 5 focused sessions. Nothing ships to `main` until you've sat the mock yourself end to end.

---

## Sources
- [Pearson PTE — Speaking & Writing test format](https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/)
- [Pearson PTE — Listening test format](https://www.pearsonpte.com/pte-academic/test-format/listening/)
- [PTE Academic Test Taker Score Guide (PDF)](https://www.pearsonpte.com/ctf-assets/yqwtwibiobs4/5Sz9Ur4qbus8AEOQdetkAj/69f6c1f2e2870980740b10a2ea9b467f/pte-academic-test-taker-score-guide-nov-2024-v4.pdf)
- [APEUni — Scored Mock Test overview](https://www.apeuni.com/blog/pte_mock_introduction_en?locale=en)
- [thePTE — How Write from Dictation is marked](https://thepte.com/how-write-from-dictation-is-marked/)
