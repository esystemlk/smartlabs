# SmartLabs admin workspace

Implemented a shared admin layout with rounded panels, a clear overview, searchable navigation and a mobile navigation dialog.

## Navigation

The original 27 destinations remain available in six groups: People, Courses & content, Payments & credits, Practice & results, Student support, and Website & system. Question Bank and Mock Tests now appear under Practice & results. AI API Settings remains developer-only in the navigation. Existing page and API permission checks still apply.

The desktop sidebar stays available inside admin tools. On smaller screens, the menu button opens a keyboard-accessible dialog. Student view, Website and Sign out remain available. The overview provides category filters and tool search, with explicit feedback for an empty search.

## Overview data

Student accounts, pending enrollments, open support tickets and certificate requests use the existing data sources. Student counts recognise both existing `student` and `user` roles. Activity uses the existing admin action log and displays Sri Lanka time. Loading and unavailable data are labelled; no revenue chart or invented activity was introduced.

## Seasonal controls

Open Seasonal Themes → Halloween → Student dashboards to manage the linked dashboard appearance, page groups, mobile display, greeting, palette, transparent companion, gentle animation and eight dedicated desktop/mobile images. Each dashboard image has its own upload control. Private previews, annual schedules, revisions, history and standard-theme restoration use the existing protected publishing workflow.

## Verification

- Existing seasonal schedule, publishing, role, private-preview and rollback tests remain applicable.
- `scripts/test-dashboard-seasonal.cjs` checks legacy configuration compatibility, exact dashboard scope, trainer/test exclusions, custom-media and contrast validation, eight bundled images and all 27 admin route destinations.
- `scripts/test-student-navigation.cjs` audits student links and legacy redirects.
- `scripts/preview-admin-workspace.cjs` serves an isolated loopback presentation using the actual admin shell, overview and seasonal settings page. Example records are clearly labelled; publishing is disabled. This is not a replacement for an authenticated deployment smoke test.
- `scripts/preview-student-workspace.cjs` previews the actual dashboard presentation with explicit local theme fixtures and no database or payment writes.

Existing individual tool handlers, transaction logic and backend authorisation were preserved. The shared layout checks the existing admin/developer/teacher roles before mounting admin content. It does not grant new permissions to individual tools.

Final verification: production build and type validation passed. All 49 existing/extended seasonal tests passed, alongside dashboard scope/media/route checks and the 218-route student link audit (zero broken literal links). Browser checks covered admin search/categories, mobile navigation, seasonal dashboard presentation, and signed-out production admin redirection to login. The live contrast helper produced zero text backplates in all five corrected PTE pricing headers. Authenticated production publishing was not performed; dashboard activation now follows the homepage theme changer.

Follow-up: removed the independent dashboard activation flag. Eligible Halloween student pages now use the homepage Off/Automatic/Manual setting directly. Existing stored dashboard flags are ignored during schema parsing. Shared annual boundaries, Off and manual expiry are covered by tests; type checking and the 49 seasonal checks passed for this follow-up. Page exclusions and trainer protections remain in force.
