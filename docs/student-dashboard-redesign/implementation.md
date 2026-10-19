# Student workspace update

Student Home now separates PTE Academic and IELTS. Course registration and saved practice results replace class/resource navigation. No registration, payment, scoring or attempt data is modified by these presentation components.

## Artwork
Five original generated images live in public/images/student: neutral workspace background and separate PTE/IELTS hero and footer illustrations. Images are decorative with readable text overlays. UI rounding and colour rules are scoped to the student workspace; public and admin layouts remain independent.

## Navigation
PTE: overview → skill → existing trainer. IELTS: overview → skill → existing Cambridge/essay practice, or mock catalog. Speaking remains marked coming soon. Older dashboard index URLs redirect to matching new pages; direct question and attempt routes remain available. Search uses the existing PTE catalog. Standalone trainers return to their matching exam skill.

## Records
Registrations read the existing authenticated account payments endpoint and display payment status, reference and amount. No classroom or join-class elements. Results read the authenticated student's test_results history, up to 100 records, and retain each original score scale. Separate IELTS mock reports remain in their existing catalog. Loading, empty and retry states are included.

## Verification
Run node scripts/test-student-navigation.cjs for all catalog routes, student menus, search and legacy redirects. link-audit.json records a static scan of literal internal href values across 216 page routes; dynamic/external links and authorized paid attempts are outside that scan. Read-only visual fixture: node scripts/preview-student-workspace.cjs on loopback port 9015. It has no database/payment connection and does not bypass app authentication.

Verified: navigation/search/legacy route checks passed; static internal-link audit found no unresolved literal page destinations. Type checking passed. Existing seasonal runtime, Christmas and contrast suites passed (17 tests). Desktop and 390px mobile visual fixtures were checked for artwork loading, readable text and overflow. Signed-in account/payment and paid scoring flows were not exercised; existing handlers remain in place.
