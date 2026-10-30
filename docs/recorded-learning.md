# SmartLabs recorded learning

## Student experience

Open **Recorded courses** in the student More menu, or use the recorded-course cards on the student home, PTE and IELTS dashboards. The catalogue is `/dashboard/recorded-sessions`.

Students can filter PTE/IELTS, search packages, compare access-duration prices, review included lessons and purchase through the existing PayHere checkout. The existing payment notification grants the same `recorded_enrollments` entitlement used previously. Returning from checkout does not itself grant access; the catalogue refreshes while waiting for confirmation.

The existing production PayHere environment settings remain required: `NEXT_PUBLIC_PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and `NEXT_PUBLIC_APP_URL`. They were absent in the local environment, so checkout was validated with isolated credentials and no live payment was submitted. Configure these on the deployed server before accepting purchases.

**My learning** shows active purchases, access expiry and marked-complete lessons. The course workspace combines Bunny Stream videos, course/grammar navigation, lesson search and downloadable documents. Completion and last-opened lesson are saved to the signed-in account. Completion is student-marked; it does not pretend to measure actual viewing time. Access is checked server-side whenever opening media, downloading a document or saving progress.

Existing PTE packages and purchases are retained. Legacy packages without an explicit exam are classified from their IELTS title/course name, otherwise PTE. The old per-class `/dashboard/recordings` catalogue and speaking-answer recording library are unchanged.

## Admin workflow

Go to `/admin/dashboard/recorded-packages`.

1. **Packages, prices & videos:** create/edit a package; select PTE, IELTS or Both; edit title, period, description, features and cover; configure unique access durations and LKR prices; enable/disable shared grammar and shared documents; publish when ready. Existing Bunny video picker, pasted embed links, CSV/LMS import and manual bank-transfer access remain available.
2. **Shared grammar & resources:** add a grammar video once using its Bunny embed URL or `libraryId/videoId`. Select **Both PTE & IELTS**, **Every matching package**, and Published. Every eligible package with Grammar included uses this same entry.
3. Add documents in the same editor. Upload a PDF/Office/ZIP file up to 4 MB, or paste an existing Firebase Storage object path, `gs://` path or Firebase download URL for this site's bucket. Larger files can be uploaded in Firebase first and linked by path. Private document delivery uses short-lived signed URLs. Existing public Firebase download tokens, if any, are not revoked by this feature.
4. Limit an item to one exam or a specific package when needed. Edit title, description, duration and sort order. Hide retains the source file/video and removes the item from student libraries.

No IELTS course, grammar video assignments, document assignments or course prices are invented or published automatically. At implementation time the existing database contained one published package with 17 class videos and no shared library entries. Configure the real IELTS lessons and shared grammar/document set in this editor.

## Playback configuration

Existing Bunny embed references continue to work. A read-only check of an existing video embed returned HTTP 200. This checks embed availability, not end-to-end viewing of every video on every device.

The optional video picker supports the site's own server environment values `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, and optional `BUNNY_STREAM_CDN_HOSTNAME`. It also retains the older `LMS_ADMIN_CONFIG` → LMS `settings/general` connection. The local setup had no LMS connection; manually pasted Bunny links work without it. These are server-only values and must never be placed in public client variables.

Optional embed signing:

- Single library: `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_EMBED_TOKEN_KEY`.
- Multiple libraries: `BUNNY_STREAM_EMBED_KEYS`, a JSON object mapping library IDs to their embed token security keys.
- Enable matching Embed View Token Authentication in Bunny and restrict allowed embedding domains there when using signed playback. Do not enable token authentication before the corresponding server key is configured.

The server uses Bunny's documented SHA-256 hex signing scheme, with the shorter of two hours or the enrollment's remaining access. Without a configured token key, it uses the existing standard Bunny embed behaviour. Website enrollment checks alone do not provide DRM or prevent copying an unsigned embed URL. [Bunny token authentication](https://docs.bunny.net/stream/token-authentication).

## Data and access

- Existing: `recorded_packages`, `recorded_classes`, `recorded_enrollments`.
- New shared library: `recorded_learning_items`, server-administered; default Firestore rules deny direct client access.
- Progress: `users/{uid}/recorded_progress/{packageId}`, through owner-authenticated server routes.
- New uploads: `recorded-learning/documents/{uuid}-{filename}` in the existing Firebase Storage bucket. No public token is added for these uploads.
- Catalogue outlines omit Bunny references and Storage paths. Media and document requests recheck active, non-expired access. Staff can preview courses.
- The Firestore rule change restricts direct `recorded_classes` reads to staff or an active package owner. Deploy that rule after the new website API is available, since the old website catalogue fetched all class references directly.
- Month-based expiry clamps to the last day of short months. Checkout always reads the database price; a changed-price guard requires the student to refresh and review a changed plan.

## Verification

`node scripts/test-recorded-learning.cjs`: sharing, exam/package scope, draft filtering, owner/expiry/suspension checks, safe outlines, month-end expiry, signed embed URL generation.

`node scripts/test-recorded-checkout.cjs`: auth, server-controlled prices, chosen access tier, changed-price detection and unchanged PayHere notification route. Uses isolated fixtures; no real orders/payments.

`node scripts/test-recorded-learning-live.cjs --run`: local production server on port 9031, hidden disposable content, three disposable accounts and a synthetic PDF. Verifies admin/student guards, active/expired access, cross-user denial, progress persistence, Bunny URL generation and signed Firebase downloads. Cleans up its fixtures; no payments or emails.

`node scripts/check-recorded-learning.cjs`: read-only provider checks without printing keys or private URLs.

`node scripts/preview-recorded-learning.cjs`: isolated UI preview on port 9040, sample courses/prices/progress, no production connection and no checkout. Browser screenshots in `docs/recorded-learning/verification/` show sample data.

## Generated artwork

Built-in image generation was used. Production asset: `public/recorded-learning/study-hero.webp`. It is used for the catalogue hero and package-cover fallback. Existing Lucide icons provide consistent interface controls; no new icon font or raster icon set was needed.

Final prompt: “Use case: stylized-concept. Asset type: wide hero artwork for SmartLabs recorded English exam learning dashboard. Premium calm 3D editorial still life: open laptop showing abstract video lecture shapes, over-ear headphones, a notebook and neatly stacked learning cards on a clean pale ivory desk. Sophisticated soft blue and teal accents, warm sunlight, tactile matte materials, realistic soft shadows. Wide landscape composition with generous clean negative space on the left for website heading, objects grouped on the right. Elegant approachable adult education aesthetic, no people, no lettering, no logos, no text, no watermark. This is a real website artwork, not a screenshot or mockup.”
