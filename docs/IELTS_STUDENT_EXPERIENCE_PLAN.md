# SmartLabs IELTS student experience

Status: proposed implementation plan, 1 October 2026. Question content will be supplied by the owner. No application changes or artwork generation are included in this planning step.

## Existing foundation

- The website is the root Next.js application. `smartlabs-app` is a separate Expo mobile client; implement the website first and carry the same structure into mobile later.
- `src/app/dashboard/page.tsx` already contains IELTS cards. Only Writing Task 2 is enabled; Speaking, Reading, Listening and Task 1 are placeholders.
- `src/components/layout/header.tsx` has an IELTS menu with similar placeholders.
- `src/app/ai-ielts-essay-practice/page.tsx` already provides essay practice and connects to the IELTS scoring and credit APIs. Reuse this capability and preserve its current URL.
- `src/app/dashboard/layout.tsx` labels the shared student area “PTE Platform.” The new IELTS area needs appropriate branding and navigation.
- Existing IELTS result types, PDF reporting and saved essay sessions provide a foundation, but all integrations require verification during implementation.

## Product direction

Create **SmartLabs IELTS Studio**, a distinct student workspace. The student chooses PTE or IELTS at the dashboard entry point and can switch later. IELTS gets its own home, navigation, question bank and progress views. Share accounts and existing payment infrastructure where appropriate; retain current credit rules until deliberately changed.

Use `/dashboard/ielts` for the hub and nested routes for `listening`, `reading`, `writing`, `speaking`, `mock-tests`, `progress` and `saved`. Make the shared dashboard layout aware of the IELTS route so an IELTS student sees IELTS branding and navigation. Avoid stacking a second sidebar inside the existing sidebar.

Offer an Academic / General Training selector. Start with Academic content because that matches the current dashboard; retain a clear General Training roadmap and publish each track only when content is available. Listening and Speaking are shared; Reading and Writing differ by track.

## Student sections

| Area | Sections to build | Student tools |
| --- | --- | --- |
| IELTS home | Continue practice, four skill cards, target band, weekly activity, saved questions | Resume the last attempt, choose a skill, see genuine progress |
| Listening | Parts 1–4; everyday conversations, everyday monologues, educational discussions, academic talks | Audio player, answer sheet, word-limit instructions, review with transcript and explanations |
| Reading | Academic passage sets; General Training everyday, workplace and extended reading | Passage and questions side by side, highlighting, question navigation, review with passage evidence |
| Writing | Academic Task 1 charts, tables, maps and processes; General Training Task 1 letters; Task 2 essays | Prompt viewer, word count, timer, draft saving, submission and feedback |
| Speaking | Part 1 interview, Part 2 cue card, Part 3 discussion | Microphone check, recording, preparation timer, playback, retry and feedback |
| Mock tests | Section tests first, full test sequences later | Timed navigation, persisted attempts, submission confirmation and results |
| My progress | Skill history, completed practice, mistakes and next steps | Track-specific results, target-band comparison where supported |
| Saved practice | Bookmarked questions and unfinished attempts | Filter by skill, resume or retry |

### Question-type coverage

Reading: multiple choice; True/False/Not Given; Yes/No/Not Given; matching information, headings, features and sentence endings; sentence completion; summary/note/table/flow-chart completion; diagram labels; short answers.

Listening: multiple choice; matching; plan/map/diagram labels; form/note/table/flow-chart/summary completion; sentence completion; short answers.

Question types are practice filters, not replacements for authentic passage sets or the four Listening parts. Keep related questions together in a shared passage/audio set.

Writing Task 2 learning filters may include opinion, discussion, advantages/disadvantages, problems/solutions and multi-part prompts. Treat these as learning categories.

## Practice flow

1. Select a skill, then a question type or complete set.
2. See the title, track, instructions, available assets and completion status.
3. Choose untimed learning practice or timed practice when implemented.
4. Complete the attempt with drafts and answers saved reliably.
5. Submit, review evidence and feedback, then retry or save for later.

Learning mode may allow audio replay and hints. Mock mode must use deliberately configured exam rules; do not silently apply learning-mode controls. Handle interrupted audio, microphone denial, upload failure and connection loss without losing student work.

Empty sections should say “New practice is being prepared” and offer another available skill. Do not invent question counts, sample achievements or active Start buttons without content.

## Distinct visual design

Theme: **an editorial study studio** — calm, premium and welcoming.

- Warm ivory background `#F8F5EF`, midnight ink `#182638`, crimson primary `#B7334B`.
- Skill accents: Listening teal, Reading blue, Writing crimson, Speaking amber. Every skill also has a text label and icon.
- Generous spacing, large headings, refined illustration panels, restrained rounded corners and clear primary actions.
- Home composition: compact IELTS navigation; a wide illustrated welcome panel; four skill cards; continue-practice and study-goal panels; recent activity.
- Practice pages: quieter surfaces with minimum decoration so passages, audio and answers remain central.
- Mobile: stacked skill cards, easy answer navigation and a clear passage/questions switch. No hover-only controls.
- Respect reduced motion, keyboard navigation and text contrast. Artwork never contains essential instructions or navigation text.

### Original generated artwork brief

Generate images during the visual implementation phase using the image-generation tool, in one consistent art direction. Store approved assets under `public/images/ielts/`.

1. **Hero — “Your next chapter”**: a sculptural open book forming an inviting architectural doorway, abstract campus shapes, subtle sound ribbons and paper forms. Warm ivory, crimson, midnight blue; soft daylight; tactile paper and ceramic materials. Wide composition with clear negative space for live HTML text.
2. **Listening**: sculptural headphones surrounding an abstract sound ribbon; teal detail.
3. **Reading**: layered book pages and an elegant reading arch; blue detail.
4. **Writing**: a flowing pen stroke above a clean notebook; crimson detail.
5. **Speaking**: two sculptural conversation forms with a small microphone; amber detail.

No baked-in lettering, fake IELTS logos, score promises or unrelated stock photography. Match lighting, perspective and material across all five images. Use responsive image sizes and suitable crops; decorative art gets empty alt text.

Generated decorative artwork is separate from question diagrams. Build precise charts, maps and labelled task figures from the supplied question data so the visual agrees exactly with the answer key.

## Content supplied by the owner

Questions can arrive section by section in a document or plain text; normalize them during import.

| Skill | Required content |
| --- | --- |
| Listening | Part, audio file, transcript, instructions, question text, options where relevant, correct answers, word limits, diagrams if needed |
| Reading | Academic/General Training, complete passage, question groups, instructions, options, answers, word limits |
| Writing | Track, task number, exact prompt, Task 1 visual/data where relevant; optional model response and teacher notes |
| Speaking | Part, exact prompts, Part 2 cue-card points, associated Part 3 questions; optional teaching notes |

All content should include a title, stable identifier and publication status. Record accepted answer variants and teacher explanations when available. Require the necessary media and answer keys before publishing automatically marked practice.

## Implementation structure

- Add an IELTS-specific catalogue and typed question-set models instead of adding IELTS fields to PTE question definitions.
- A question set owns its passage/audio/visual, track, skill, parts and grouped questions. Questions have stable IDs, instructions, type-specific options and scoring configuration.
- Keep answer keys out of student-readable documents and initial practice responses. Grade server-side and release explanations after submission under the selected mode's rules.
- Store IELTS attempts separately from PTE attempts. Associate every attempt with a question-set version so later edits do not change past results.
- Extend the admin question bank with a distinct IELTS area: draft, validate, preview and publish. Add media uploads and set-level grouping.
- Enforce student ownership for saved attempts and privileged access for publishing. Validate media type/size and provide accessible audio controls.
- Link the existing essay trainer from the new Writing section first; adapt its presentation later without breaking saved sessions, credits or the old public URL.
- Use objective answer-key scoring for Reading/Listening. Show AI Writing/Speaking feedback as practice estimates; do not imply official examiner certification. Do not claim pronunciation scoring from a transcript alone.
- Show raw marks until an appropriate section/track conversion is supported. Do not infer a full-test band from a few practice answers or an essay alone.

## Delivery sequence

1. **IELTS foundation and design:** dedicated hub, route-aware sidebar, mobile navigation, generated artwork, four skill landing pages, honest availability states and the existing Task 2 link.
2. **Content foundation:** IELTS question models, admin/import workflow, draft preview and first owner-supplied question sets.
3. **Reading and Listening:** set-based practice, answer saving, grading, transcript/evidence review and learning/timed modes.
4. **Writing and Speaking:** Task 1, integrated Task 2, reliable audio recording and validated feedback workflows.
5. **Progress and mocks:** persisted history, saved questions, section mocks, then complete mock sequences once all required content and scoring paths exist.

## Completion checks

- IELTS routes consistently show IELTS navigation, while existing PTE routes still work.
- Old IELTS essay links, scoring, payments and saved history remain functional.
- Every enabled action leads to a working screen with real published content.
- Reading/Listening fixtures verify accepted answers, word limits and review behavior; student-facing requests do not expose answer keys early.
- Interrupted attempts resume safely, and one student cannot read another student's answers.
- Desktop and mobile screens are visually inspected; keyboard, recording permission and audio failure paths are checked.
- Progress comes from persisted attempts and clearly identifies practice estimates.

## Format references

- https://ielts.org/take-a-test/test-types/ielts-academic-test
- https://ielts.org/take-a-test/test-types/ielts-general-training-test
- https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test

Verify detailed timings, delivery-mode rules and scoring behavior against the relevant official format when implementing each practice engine.
