# Full Mock 1 setup

The student entry is `/mock/full-1`, linked from `/mock-tests`. Staff review completed attempts at `/admin/dashboard/full-mocks`, linked from the existing mock administration page.

## Manual institute payment credits

Admins and developers can open `/admin/dashboard/credit-manager` and choose **PTE Mock credits** or **IELTS Mock credits** beside the existing **Universal & AI credits** tab.

1. Find the registered student by email. Students with zero credits can be found here.
2. Check the student name and the selected exam's current balance.
3. Enter the number of mock credits to add and the institute receipt or bank reference. Optionally record the amount received in LKR and an internal note; choose cash, bank transfer, card, or other.
4. Add the credits. The payment must already have been received; this form does not collect money.

PTE grants update `mockPaidCredits`; IELTS grants update `ieltsMockPaidCredits`. Universal and other individual AI pools are unchanged. The balance update and admin audit receipt are committed atomically. A retry, refresh, or another admin entering the same payment reference for the same student and exam pool cannot add the credits twice. Conflicting details for a used reference are rejected. A payment that includes both exams can be recorded as separate PTE and IELTS grants.

The existing PTE grant tool on mock administration remains compatible. Its older requests default to the PTE pool.

## Dedicated AI key

Configure this **server-only** variable in `.env.local` for development and in the hosting provider's environment for deployment:

```dotenv
GOOGLE_GENAI_API_KEY_6=your_new_Gemini_API_key
```

Restart the local server or redeploy after changing environment variables. Do not prefix this variable with `NEXT_PUBLIC_` and do not commit secrets.

Full mocks use key 6 for all AI assessment and missing reference transcription. Keys 1–5 remain exclusive to their existing individual practice pool. If key 6 fails, the mock preserves responses and retries with key 6; it does not borrow a practice key. If key 6 is missing, new attempts are blocked before charging a mock credit.

No rubric or marking rule in the existing essay, speaking, SWT, SST, or WFD scorers was changed. The shared transport only selects a request-scoped credential. The new aggregation layer combines the existing marks using the approved weighting table and labels the five totals as practice estimates.

## Firebase

The existing Firebase Admin service account and Storage bucket are reused. The read-only upload audit passed: 66 Firestore documents and 42 byte-identical media assets.

New server-managed collections are `pte_full_mock_attempts`, `pte_full_mock_sessions`, and `pte_full_mock_references`. Responses, source snapshots, cached scores, notes, and scoring leases are subcollections of attempts. Recordings use the private `full-mock-responses/` Storage prefix. Existing default-deny Firestore rules protect these collections; authenticated server routes enforce ownership and staff access.

One existing mock credit is deducted atomically when an attempt is created. The same unfinished attempt resumes without another debit. Individual AI credit pools are bypassed only in authenticated server-side scorer calls. Background marking is driven by awaited requests while the exam/report is open; reopening an attempt resumes pending marking after a disconnect.

## Verification

```powershell
node --test tests/full-mock.test.cjs tests/mock-credit-grants.test.cjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-mock-questions.cjs
npm run build
```

A complete live microphone/browser run and live AI check require key 6 and an authenticated test account. Automated route tests use isolated fixtures and never debit real student accounts.
