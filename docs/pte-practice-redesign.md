# PTE practice studio redesign

The essay trainer keeps its existing design. Summarize Written Text, Summarize Spoken Text and Write From Dictation now share a quieter, clearer practice layout.

## Student experience

- A task-specific welcome panel explains the purpose of the task and provides a direct link to the question library.
- Three short instructions describe preparing, responding and reviewing feedback.
- A searchable library filters titles and categories. Filtered cards retain their original question identity; lecture transcripts are never searched or displayed in the library.
- Selecting a question opens a focused response workspace and moves keyboard focus to its heading. Progress indicates the response and feedback stages.
- Word guidance, audio controls, timers, submission buttons and result components retain their existing behaviour. Response labels are explicitly associated with their text fields, and audio buttons have accessible names.
- Credits remain visible through the existing live CreditsPill component. Top-ups use `/credits`.
- Loading, empty-library, no-match and signed-out states provide clear next steps.

Written summary uses violet, spoken summary uses teal and dictation uses blue. Rounded panels, generous spacing and a light reading surface keep the content legible. The hero illustrations use CSS and existing icons. They scale without extra image downloads or animation distractions.

The shared `/dashboard/practice` layout also adds a consistent reading frame to speaking, reading and listening tasks. Their recording, question navigation and scoring controls remain in the existing trainer components. The marketing header spacing and footer are excluded from the two redesigned standalone summary pages, as they already were for dictation.

## Implementation

- `src/components/pte/practice-design.tsx` and `.css`: welcome panels, shared navigation, question library and response progress.
- `src/app/swt-trainer/page.tsx`, `src/app/ai-sst-practice/page.tsx`, `src/app/ai-wfd-practice/page.tsx`: presentation integration.
- `src/app/dashboard/practice/layout.tsx` and `src/components/pte/task-workspace.css`: shared task frame.
- `scripts/preview-pte-practice.cjs`: loopback-only interactive preview of the actual pages with labelled sample data. Firebase and activity services are isolated, payment destinations are stubbed, and every POST is rejected. No production auth bypass is introduced.
- `scripts/test-pte-practice-design.cjs`: search identity, hidden transcript protection, locked-library privacy, navigation destinations and progress checks.

## Verification

The new design tests pass. The student link audit checks 218 routes and reports no broken literal links. Seventeen existing audio, selection, scoring, credit and retry handlers were compared with the previous version and remain intact, excluding pre-existing activity logging changes that are outside this design commit.

Browser checks use the actual page components with isolated example data. Verified filtered selection, keyboard focus transfer, live word counting, disabled empty submissions, audio playback, the dictation play count, hidden lecture transcripts, and a 375px content width without horizontal page overflow. Live paid scoring, purchases and microphone recording are not exercised by this preview.

Type checking and the final production build passed, including generation of all 337 pages. A desktop screenshot is saved in pte-practice-redesign/verification/sst-desktop.webp.
