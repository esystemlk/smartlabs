# Saved speaking answers and compact PTE question banks

## Student flow

All seven shared PTE speaking trainers now support microphone answers and prerecorded uploads. Sign-in is required for saving and AI checking. Uploads have a local audio preview and a separate **Save & check with AI** button; selecting a file does not submit it. Supported containers: MP3, M4A/MP4 audio, WAV, OGG and WebM. The limit is 4 MB, and the browser checks uploaded duration against the selected task's recording time.

Microphone answers retain Stop & Score. Audio is saved before checking starts. A failed save leaves a local replay/download and retry option; a failed AI check leaves the saved answer available. Cancelling a recorder or changing questions does not submit an unfinished recording. Asynchronous responses from an abandoned question cannot overwrite the next question's state.

Students can open **My recordings** from any speaking trainer, or **Listen to my speaking recordings** from Results. `/dashboard/speaking-recordings` provides private replay, download, saved transcript/feedback, retry checking, task filtering, older pages and explicit deletion confirmation. Existing course/class recordings at `/dashboard/recordings` retain their original page and behaviour.

Saved replay and downloads do not consume AI credits. Checking uses the existing speaking/universal credit pools and subscription rules. A credit is reserved transactionally for a new check, returned on failure, and not charged again when an existing saved score is retrieved. Parallel requests cannot check the same answer twice. Expired reservations are reused on retry or refunded on deletion.

## Storage and access

- Audio: the existing Firebase Storage bucket, at `speaking-answers/{uid}/{answerId}`. No public download token or public URL is created.
- Metadata and full AI feedback: Firestore `users/{uid}/speaking_recordings/{answerId}`. Audio bytes are not stored in Firestore documents.
- Authenticated API routes derive the user exclusively from a verified Firebase ID token. Listing, replay, scoring and deletion are always scoped to that uid. Clients cannot choose another owner's path.
- Existing deny-by-default Firestore and Storage rules cover these new paths; the Admin SDK performs server-only access. No public-read rule or rules deployment is added.
- Audio uploads check size, task type and container signature; Describe Image uses the image saved in the admin question bank. Saved answers retain that question's reference for later checking.
- Repeated saves use a stable answer ID and storage generation preconditions. Pagination uses a timestamp/ID cursor so deleting a row does not break older-page navigation.
- No automatic expiry is added. Students can remove their recordings and feedback using Delete.

The implementation uses the project's existing Firebase Admin credentials and bucket. [Firebase Admin Storage documentation](https://firebase.google.com/docs/storage/admin/start).

## Large question banks

Speaking, reading, interactive listening, SWT, SST and dictation use a shared compact browser with 12 rows per page. It includes title/number search, direct question-number jump, result counts, selected-question indication and page controls. Original indices are retained when searching. Audio transcripts/answers are not used as listening search labels. The essay trainer remains unchanged.

On mobile, task workspaces show a compact **Choose** control above the question; selecting a row collapses the browser. On desktop, speaking/reading keep the bank beside the response workspace. Summary/dictation libraries use compact full-width rows rather than large repeated cards. Only the current page's rows are rendered; existing question-bank fetching is unchanged.

## Verification

- Production build and TypeScript validation pass.
- Isolated API tests cover missing authentication, cross-user isolation, invalid audio, idempotent saving, byte-exact replay, cached scores, paid-credit reservation/refund, no-credit gating, concurrent checking/deletion and deletion-safe pagination.
- A live Firebase smoke test used two disposable users and synthetic silent WAV data. Save, list, byte-exact replay, cross-account denial, no-credit checking denial and deletion passed. Test users and their records were cleaned up. No live AI calls or purchases were made.
- Browser fixture checks: a 1,000-question search selected #750 correctly; mobile jump selected #999 and collapsed the list; the workspace had no horizontal overflow. A synthetic uploaded WAV opened the local preview, and the isolated save/check flow displayed sample feedback. Saved-history replay and feedback disclosure were checked.
- A 10,000-question render test displays 12 rows and retains original search indices. Navigation audit: 220 routes, no broken literal links.
- Optional live smoke command: `node scripts/test-speaking-recordings-live.cjs --run`, with a local production server on port 9031. This creates and removes only prefixed disposable test users and synthetic recordings.
- Isolated UI preview: `node scripts/preview-speaking-recordings.cjs`, port 9030. All data/feedback are labelled examples, and it has no Firebase/AI connection.

Browser screenshots are in `speaking-recordings/verification/` and show isolated example data, not a student's real recording or score.
