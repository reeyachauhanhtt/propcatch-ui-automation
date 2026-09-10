# PropCatch Automation Testing Progress

## 1. Overview

This document summarises the **black-box UI automation** work completed for the PropCatch application. It is based on a review of the existing automation project only. No test cases were assumed from folder names, and no unwritten work is claimed.

**Application under test:** PropCatch, covering:

- the **User** web application (property discovery, enquiries, account features)
- the **Admin** web application (inventory, leads, pipeline, and operations)
- **shared workflows** where a change in one application should be visible in the other

**Automation approach:** End-to-end browser tests run against the live User and Admin applications. Tests interact with the UI as a user would (open pages, fill forms, click actions, and check results). A smaller set of read-only API checks is also present.

**Main technologies:** Playwright, TypeScript, Node.js, and Chromium. User tests are also configured for Firefox and WebKit, but the default run command uses Chromium.

**Scale of implemented work (from the codebase):**

| Item | Count |
|------|-------|
| Spec files with actual tests | 116 |
| Defined automated scenarios | about 700 |
| User-side spec files | 53 |
| Admin-side spec files | 55 |
| Cross-platform spec files | 6 |
| API spec files | 2 |
| Reusable page-helper files | 35 |

These counts come from the test files themselves. A small number of scenarios are generated in loops at runtime (for example, several invalid email formats, several protected Admin routes, and three user enquiry types), so the number of tests executed can be slightly higher than the number of `test()` declarations.

---

## 2. Automation Scope

| Area | Status | Coverage |
|------|--------|----------|
| User Side | Completed, with a few blocked scenarios | Login, homepage, project listing, project details, builders, compare, map, notifications, shortlist, profile (enquiries, messages, visits, saved searches), legal pages, plus limited accessibility and visual checks |
| Admin Side | Partially Completed | Most Admin modules have list, filter, and workflow coverage. Users is list/detail only. Audit log and Settings are reached by navigation tests only, with no dedicated feature suites |
| Cross Platform | Partially Completed | Admin-to-User visibility and User-to-Admin lead generation are implemented. Two reserved cross-platform folders exist but contain no tests. WhatsApp lead generation is skipped |

Additional coverage (not a separate product area, but present in the project):

| Area | Status | Coverage |
|------|--------|----------|
| API read checks | Completed | Public and authenticated read checks against the backend. These do not create or change data |

---

## 3. User-Side Automation

User tests live under `tests/user` and reuse helpers in `pages/user`. Authenticated tests log in once and reuse the saved session.

| Feature | Automated Scenarios | Status | Test Location |
|---------|---------------------|--------|---------------|
| Login | Page load and field behaviour; successful email/password login; empty and invalid email/password; wrong credentials; unknown user; loading state; network/API failure handling; forgot-password UI; session after refresh; logout; protected-route redirect. Mobile OTP tab UI is covered. Full OTP login is skipped (no OTP test harness). | Completed, except OTP login | `tests/user/auth/login.spec.ts` |
| Signup | Page load, required fields, empty submit blocked, invalid email, short password, login/signup navigation. Successful live signup is skipped (no disposable signup account). | Partially Completed | `tests/user/auth/signup.spec.ts` |
| Homepage | Load after login, hero and sections, header, featured/explore projects, footer, city selector, session/public access, laptop and mobile layout, logout behaviour | Completed | `tests/user/homepage/homepage-ui.spec.ts` |
| Homepage navigation | Header, CTAs, footer, profile, and mobile bottom navigation to Projects, Builders, Map, Compare, Search, Notifications, Shortlist, Profile, Visits, Enquiries, Saved Searches, and legal pages | Completed | `tests/user/homepage/navigation.spec.ts` |
| Homepage projects | Card content, open details, compare toggle, featured carousel, image load | Completed | `tests/user/homepage/projects.spec.ts` |
| Homepage notifications | Icon, open notifications, list or empty state, open related project, return home. Opening a notification is skipped when the account has none. | Completed | `tests/user/homepage/notifications.spec.ts` |
| Project listing | Page load, card content, authenticated and public access | Completed | `tests/user/projects/project-listing.spec.ts` |
| Project search | Visible search, exact/partial match, empty search, spaces, no-results empty state and recovery | Completed | `tests/user/projects/project-search.spec.ts` |
| Project filters | Open filters; status and configuration filters; combined filters; clear/reset; empty results; state after navigation and refresh | Completed | `tests/user/projects/project-filters.spec.ts` |
| Project listing compare | Select, open compare, remove, clear all, maximum of 3 projects | Completed | `tests/user/projects/project-compare.spec.ts` |
| Project navigation | Card to details, homepage to listing, browser Back, city selector | Completed | `tests/user/projects/project-navigation.spec.ts` |
| Project details — overview | Load, name, status, location, key sections, public and authenticated access | Completed | `tests/user/project-details/project-overview.spec.ts` |
| Project details — information | Configuration, area, price, possession, RERA, about text, placeholders for missing values | Completed | `tests/user/project-details/project-information.spec.ts` |
| Project details — pricing | Price display, range, starting-at price, EMI calculator and inputs | Completed | `tests/user/project-details/project-pricing.spec.ts` |
| Project details — builder | Builder shown, link to builder page, builder’s projects listed | Completed | `tests/user/project-details/project-builder.spec.ts` |
| Project details — amenities | Section display, amenity list, no broken values | Completed | `tests/user/project-details/project-amenities.spec.ts` |
| Project details — media | Hero image, gallery counter, next/previous, floor plans | Completed | `tests/user/project-details/project-media.spec.ts` |
| Project details — documents | Downloads section, brochure display, PDF opens in a new tab | Completed | `tests/user/project-details/project-documents.spec.ts` |
| Project actions — site visit | Button visible; unauthenticated gate; booking form; submit confirmation; enquiry created; open referenced project | Completed | `tests/user/project-details/actions/` (`site-visit`, `site-visit-schedule`, `site-visit-validation`) |
| Project actions — callback | Modal, submit confirmation, enquiry created as Callback | Completed | `tests/user/project-details/actions/request-callback.spec.ts` |
| Project actions — contact builder | Modal, submit confirmation, enquiry created as General | Completed | `tests/user/project-details/actions/contact-builder.spec.ts` |
| Project actions — contact channels | Share, Call, WhatsApp controls | Completed | `tests/user/project-details/actions/contact-channels.spec.ts` |
| Project actions — sign-in gates | Contact builder, callback, and shortlist gated for logged-out users | Completed | `tests/user/project-details/actions/lead-actions.spec.ts` |
| Builders listing | Heading, public access, seeded builders, sort, card content, read-only, open detail | Completed | `tests/user/builders/builders-listing.spec.ts` |
| Builder detail | Name, logo/monogram, verified badge, tagline, website, stats, projects, compare, open project | Completed | `tests/user/builders/builder-detail.spec.ts` |
| Compare | Selection, count, toggle off, compare page, attributes, side-by-side, back navigation, remove, empty state, max 3 projects, persistence, public and authenticated access | Completed | `tests/user/compare/` |
| Map | Page load, entry points, map UI, pins, public access | Completed | `tests/user/map/map-page.spec.ts` |
| Notifications | Auth gating, heading, date grouping, title/body, project link, read-only list | Completed | `tests/user/notifications/` |
| Shortlist | Auth gating, save/remove, list page, persistence, open project | Completed | `tests/user/shortlist/` |
| Profile overview | Auth gating, name/email, avatar, account/legal links, Sign out, read-only overview | Completed | `tests/user/profile/profile-overview/` |
| Enquiries | Auth gating, list content, types, project links, create via site visit / callback / contact builder | Completed | `tests/user/profile/enquiries/` |
| Messages | Auth gating, conversation list, thread, send message, persist after reload | Completed | `tests/user/profile/messages/` |
| Site visits (user) | Auth gating, past visits list, locality, status, project links, read-only page | Completed | `tests/user/profile/visits/` |
| Saved searches | Auth gating, list, name/criteria, Notify toggle persistence. Delete button is visible; delete/create flows are not exercised because they are treated as no-ops in the live app. | Partially Completed | `tests/user/profile/saved-searches/` |
| Legal pages | Privacy, Terms, and Data Deletion page load, URLs, footer/profile entry, no application error. Data-deletion form controls are checked without submitting a deletion. | Completed | `tests/user/legal/` |
| Accessibility | axe-core scans of Builders (full page) and homepage header; critical issues gated. Limited page coverage; written as a concept demonstration. | Completed, limited scope | `tests/user/accessibility/accessibility.spec.ts` |
| Visual checks | Screenshot comparison for Builders page, homepage hero, and masked homepage. Limited page coverage; written as a concept demonstration. | Completed, limited scope | `tests/user/visual/visual-regression.spec.ts` |

---

## 4. Admin-Side Automation

Admin tests live under `tests/admin` and reuse helpers in `pages/admin`. Module tests reuse a saved Admin session. Login/logout tests run separately so they cannot invalidate that session.

The Admin sidebar lists 17 modules. Dedicated test suites exist for 15 of them. **Audit log** and **Settings** are opened from navigation tests only.

| Feature | Automated Scenarios | Status | Test Location |
|---------|---------------------|--------|---------------|
| Login | Page UI, successful login, Enter submit, post-login redirect, empty/invalid fields, wrong password, unknown email, non-admin denied, loading state, session after refresh, sign out | Completed | `tests/admin/auth/login.spec.ts` |
| Forgot password | Page load, empty email, confirmation for valid email, change address, back to sign in, entry from login | Completed | `tests/admin/auth/forgot-password.spec.ts` |
| Reset password | Missing token, invalid/expired link, request a new link. Successful password update is skipped (no recovery-token harness). | Partially Completed | `tests/admin/auth/reset-password.spec.ts` |
| Session gating | Unauthenticated access to protected routes redirects to login; root redirects to login; after logout, protected routes remain blocked | Completed | `tests/admin/auth/session-gating.spec.ts` |
| Dashboard UI | Load, redirect from `/`, inventory and pipeline metrics, follow-ups, upcoming visits, quick actions, refresh | Completed | `tests/admin/dashboard/dashboard-ui.spec.ts` |
| Dashboard navigation | Metric cards open the related module; quick actions open create forms; overdue follow-up row opens a lead when one exists | Completed | `tests/admin/dashboard/dashboard-navigation.spec.ts` |
| Admin shell | Sidebar, brand, topbar, footer, all 17 module links, active state, Reminders badge, profile link, navigation to Builders/Projects/Leads/Reminders/Freshness/Audit log/Settings | Completed for shell; Audit log and Settings have no feature suites | `tests/admin/dashboard/shell.spec.ts` |
| Builders | List, pagination, create form, required validation, create/edit/soft-delete, cancel delete, logo upload, seeded detail | Completed | `tests/admin/builders/` |
| Projects | List, pagination, create/edit/soft-delete, amenities, media (hero, gallery, floor plan, brochure, RERA PDF) | Completed | `tests/admin/projects/` |
| Units | List, filters, create/edit/soft-delete, availability labels, media upload | Completed | `tests/admin/units/` |
| Pricing | List, search, filters, record project- and unit-level price, append-only (no edit/delete), negative/empty validation, deep-link and regression checks | Completed | `tests/admin/pricing/` |
| Availability | List, status/project/aging filters, empty state, quick status change, deep-link and label regression | Completed | `tests/admin/availability/` |
| Leads | List, search, filters, create/edit/soft-delete, detail, status change, attachment, reassign, follow-up, callback, communication log, tester-lead cleanup | Completed | `tests/admin/leads/` |
| Pipeline | Funnel, board, project filter, card opens lead, Today’s actions linked to Reminders | Completed | `tests/admin/pipeline/` |
| Site visits | List, filters, create/edit, validation, no delete action, detail, status change, contact/project links | Completed | `tests/admin/site-visits/` |
| Reminders | Grouped list, filter chips, counts, follow-up/callback lifecycle, completed items drop off, communication log is not treated as a reminder | Completed | `tests/admin/reminders/` |
| Verification | Page load, empty queues, status tabs, builder document appears after upload, open builder, approve pending document | Completed | `tests/admin/verification/` |
| Reports | Overview, default 30-day range, date/project filters, sales-rep activity, assignment count increases after assigning a lead | Completed | `tests/admin/reports/` |
| Data freshness | List, pagination, entity type and stale-age filters, reset | Completed | `tests/admin/freshness/` |
| Localities | List, city/name/inactive filters, create, deactivate/reactivate, new locality appears in Project dropdowns | Completed | `tests/admin/localities/` |
| Users | List load, identity/role/status/created columns, open user detail. No create/edit/role/status suite. Avatar upload is covered in cross-platform tests. | Partially Completed | `tests/admin/users/users-list.spec.ts` |
| Audit log | Sidebar link is present and the page can be opened from shell navigation | Planned (navigation only) | `tests/admin/dashboard/shell.spec.ts` only |
| Settings | Sidebar link is present; `/settings` is included in session-gating; page can be opened from shell navigation | Planned (navigation only) | `tests/admin/dashboard/shell.spec.ts` and `tests/admin/auth/session-gating.spec.ts` |

---

## 5. Cross-Platform Automation

These tests check that User and Admin share application data. They live under `tests/cross-platform` and use `pages/crossPlatform.ts` to open a separate User browser context beside the Admin session.

| Flow | What was automated | Status | Test Location |
|------|--------------------|--------|---------------|
| Admin project → User site | New Admin project with builder, amenities, and media appears on the User site; soft-deleted and inactive projects are hidden; amenity/name/status/description edits appear; brochure publishes to User downloads while RERA stays on Admin; hero media delete/replace; builder link; city filter | Completed | `tests/cross-platform/admin-to-user-project-visibility.spec.ts` |
| Admin builder → User site | New QA builder with logo appears on User builders; linked project appears on User builder detail; soft-deleted builder disappears | Completed | `tests/cross-platform/admin-to-user-builder-visibility.spec.ts` |
| Admin unit → User project detail | Unit configuration, area, and price appear on User project detail; edits update the User page | Completed | `tests/cross-platform/admin-to-user-unit-visibility.spec.ts` |
| Admin site visit → User visits | Admin-scheduled visit appears on User Site Visits; Admin status change is reflected there | Completed | `tests/cross-platform/admin-to-user-site-visit-visibility.spec.ts` |
| Admin avatar → User profile | Avatar uploaded on Admin Users appears on the User Profile | Completed | `tests/cross-platform/admin-to-user-avatar-visibility.spec.ts` |
| User enquiry → Admin leads/pipeline | User site visit, callback, and contact-builder enquiries create an Admin lead and pipeline card. WhatsApp enquiry is skipped (external handoff; lead cannot be identified and cleaned up safely). | Partially Completed | `tests/cross-platform/user-to-admin-lead-generation.spec.ts` |

**Folders that exist but do not contain tests:**

| Folder | Contents | Assessment |
|--------|----------|------------|
| `tests/cross-platform/project-sync/` | Empty placeholder only | Planned, not implemented |
| `tests/cross-platform/user-activity/` | Empty placeholder only | Planned, not implemented |

---

## 6. Test Scenario Coverage

The types below are present in the implemented tests. This is not a claim of complete product coverage.

### Positive Scenarios

- User and Admin login with valid credentials
- User can browse homepage, projects, builders, map, and compare
- User can open project details and view information, pricing, media, amenities, builder, and documents
- User can save/remove shortlist items
- User can submit site visit, callback, and contact-builder requests
- User can send a message in an existing conversation
- Admin can create, edit, and soft-delete builders, projects, units, and leads
- Admin can record prices, change availability, schedule/edit site visits, and manage follow-ups and callbacks
- Admin dashboard metrics and quick actions open the expected pages
- Admin-created inventory and visits appear on the User application
- User enquiries appear as Admin leads and pipeline cards

### Negative Scenarios

- Invalid, empty, or unknown User login credentials
- Invalid email formats and short passwords
- Non-admin account cannot open the Admin portal
- Unauthenticated users are redirected from protected User and Admin pages
- Search with no matching project, lead, or price shows an empty state
- Soft-deleted or inactive Admin records disappear from the User site
- Combined filters that match nothing show an empty state (User projects; Admin availability)
- Network/API failure during User login is handled without leaving the login page
- Invalid Admin reset-password link shows an error
- WhatsApp lead generation is not automated (explicitly skipped)

### Validation Scenarios

- User login email/password required and format checks
- User signup required fields, invalid email, and minimum password length
- Site-visit form: submit disabled until name and phone are provided; 10-digit phone rule; email/message optional
- Compare limited to 3 projects; a 4th selection is prevented
- Admin create forms for builders, projects, units, leads, site visits, and pricing show required-field validation
- Admin pricing rejects missing price and normalises negative price values
- Admin site-visit create form validates empty required fields
- Admin forgot-password send action stays disabled when email is empty

### UI / Functional Scenarios

- Header, footer, sidebar, and mobile bottom navigation
- City selector and city-based project listing
- Filters, search, pagination, refresh, and deep-link query behaviour
- Media upload (builder logo, project media, unit media, lead attachment, user avatar)
- Dashboard metric cards, pipeline board scrolling, reminder chips
- Public vs authenticated access for User pages
- Accessibility scans (limited pages)
- Visual screenshot comparison (limited pages)

### Cross-Platform / Shared Workflow Testing

- Admin inventory changes reflected on the User site
- Admin visit scheduling and status changes reflected on User Site Visits
- Admin avatar reflected on User Profile
- User enquiry actions reflected on Admin Leads and Pipeline

### Other Types Present in the Code

- **Authorization / session testing:** login required for protected pages; logout clears access
- **API read testing:** anonymous vs signed-in vs admin visibility of backend data
- **Accessibility testing:** axe-core scans gated on critical issues
- **Visual comparison testing:** baseline screenshot checks on a small set of pages

---

## 7. Automation Framework & Tools

| Tool / Technology | Purpose |
|-------------------|---------|
| Playwright | Browser automation, assertions, traces, screenshots, video, HTML report |
| TypeScript | Language used for tests and page helpers |
| Node.js | Runtime for the test project |
| Chromium | Default browser for User, Admin, and cross-platform runs |
| Firefox | Configured for User tests (not the default run command) |
| WebKit | Configured for User tests (not the default run command) |
| dotenv | Loads local environment settings for base URLs and test accounts |
| @axe-core/playwright | Accessibility scans on selected User pages |
| HTML report | Playwright HTML report after a run (`npm run report`) |

**How the project is structured**

- `tests/user` — User application tests, grouped by feature
- `tests/admin` — Admin application tests, grouped by module
- `tests/cross-platform` — User and Admin together
- `tests/api` — read-only backend checks
- `pages/user`, `pages/admin`, `pages/crossPlatform.ts` — reusable page helpers (open page, locate controls, complete common actions)
- `test-data/images` and `test-data/docs` — sample images and a PDF used for media upload tests
- `playwright.config.ts` — browsers, projects, reporting, and authentication files
- `scripts/` — local probe scripts used to inspect live pages; these are not the automated test suite

**Locator strategy (as used in helpers)**

- Prefer accessible locators: role, label, heading, button, and placeholder
- Use `data-testid` where the application exposes it (for example Admin login error, logout, some media and reminder controls)
- Use CSS/table locators where needed for list rows, cards, and filters

**Assertions**

- Playwright `expect` checks for visibility, URL, text, counts, enabled/disabled state, and screenshots
- Form validation also checks native HTML validity where used (User login/signup)

**Authentication / setup**

- User and Admin each have a one-time login setup that saves a session file
- Authenticated tests reuse that session
- Specs that must start logged out use an empty session
- Cross-platform tests keep the Admin session and open a separate User browser context
- Credentials are read from local environment variables; they are not stored in this document

**Reporting / debugging**

- HTML report
- Full-page screenshot on each test
- Video recording
- Trace kept on failure

**Empty support folders (placeholders only)**

- `fixtures/admin`, `fixtures/user`, `fixtures/cross-platform`
- `test-data/admin`, `test-data/user`, `test-data/cross-platform`
- `tests/files`

These folders exist but do not contain reusable fixtures or structured test-data files.

**CI/CD**

No CI pipeline files (for example GitHub Actions) were found in this project.

---

## 8. Test Organization

**User vs Admin separation**

- User tests target the User application and run under the Chromium (and optionally Firefox/WebKit) projects
- Admin tests target the Admin application under `admin-chromium`
- Admin login/logout tests run in a separate `admin-auth` project so they do not sign out the shared Admin session

**Feature-based organization**

- User: `auth`, `homepage`, `projects`, `project-details`, `builders`, `compare`, `map`, `notifications`, `shortlist`, `profile`, `legal`, `accessibility`, `visual`
- Admin: one folder per module (`builders`, `projects`, `units`, `leads`, and so on)

**Cross-platform tests**

- Kept in `tests/cross-platform`
- Implemented files sit at that folder root
- `project-sync` and `user-activity` subfolders are reserved but empty

**Reusable helpers**

- Page helpers wrap locators and common flows (login, open list, create QA records, upload media, clean up disposable records)
- Cross-platform helper opens an independent User browser context

**Test data handling**

- Live test accounts come from environment variables
- Disposable QA records (named with a QA prefix) are created and often deleted inside tests
- Sample media files are stored under `test-data/images` and `test-data/docs`
- Structured data folders for user/admin/cross-platform are empty placeholders

**How tests are run**

| Command | What it runs |
|---------|----------------|
| `npm test` | User tests on Chromium |
| `npm run test:admin` | Admin module and cross-platform tests |
| `npm run test:admin:auth` | Admin login/logout tests |
| `npm run test:admin:all` | Admin auth tests, then Admin module tests |
| `npm run test:cross` | Cross-platform tests |
| `npx playwright test --project=api` | API read checks |
| `npm run report` | Open the HTML report |

---

## 9. Current Progress Summary

### Completed

- Playwright + TypeScript framework for User, Admin, and cross-platform UI tests
- Saved-session login for User and Admin
- Broad User-side coverage: login, homepage, listing, details, builders, compare, map, notifications, shortlist, profile areas, and legal pages
- Broad Admin-side coverage: dashboard/shell and most operational modules (builders, projects, units, pricing, availability, leads, pipeline, site visits, reminders, verification, reports, freshness, localities)
- Cross-platform visibility for projects, builders, units, site visits, and avatar
- User enquiry to Admin lead/pipeline for site visit, callback, and contact builder
- Read-only API checks for public and authenticated access
- HTML reporting, screenshots, video, and failure traces
- Limited accessibility and visual checks on selected User pages

### In Progress

- No incomplete test files were found. Recent work appears checked in as finished specs rather than unfinished drafts.
- Remaining gaps are expansion of thinner areas and scenarios that are currently skipped, not half-written tests.

### Remaining / Planned

- Full Mobile OTP login (UI tab exists; end-to-end OTP is skipped)
- Successful User signup (page/validation exist; live signup is skipped)
- Successful Admin password update after a real reset link (error-path UI exists; happy path is skipped)
- WhatsApp enquiry to Admin lead (skipped)
- Deeper Admin **Users** coverage beyond list and detail
- Dedicated **Audit log** feature tests (currently navigation only)
- Dedicated **Settings** feature tests (currently navigation and session gating only)
- Saved-search create and delete (Notify toggle is tested; create/delete are not)
- Cross-platform folders `project-sync` and `user-activity` (empty)
- Broader accessibility and visual coverage beyond the current sample pages
- CI/CD pipeline (not present)
- Reusable fixture/test-data folders are reserved but unused

---

## 10. Overall Status

The PropCatch UI automation framework is in place using Playwright and TypeScript. User-side journeys and most Admin modules have implemented automated coverage, including list, filter, create/update, validation, and navigation checks. Cross-platform tests confirm that Admin inventory and visit changes appear on the User site, and that User enquiries appear as Admin leads.

The remaining work is not a missing framework. It is deeper coverage of thinner Admin areas (Users, Audit log, Settings), a small set of scenarios blocked by missing test harnesses (OTP login, live signup, password-reset token, WhatsApp), empty reserved cross-platform folders, and operational items such as CI/CD.

This is a substantial implemented suite, not a planning-only effort. It is not 100% of the product, and the items in Section 9 should be treated as the next backlog.

---

## 11. Recommended Next Steps

These are recommendations. They are not completed work.

1. **Close the known skipped scenarios** where a safe harness can be added: OTP login, disposable signup, Admin password-reset token, and (if a safe identifier exists) WhatsApp lead tracking.
2. **Add dedicated Admin tests** for Audit log and Settings, and expand Users beyond list/detail if those modules are in scope.
3. **Decide whether** `tests/cross-platform/project-sync` and `user-activity` should be implemented or removed as unused placeholders.
4. **Run the existing suite as regression** on User (`npm test`), Admin (`npm run test:admin:all`), and cross-platform (`npm run test:cross`) before releases.
5. **Add CI/CD** so the suite runs on a schedule or on each change, using the HTML report and traces already configured.
6. **Widen accessibility and visual coverage** only after the current sample checks are accepted as the pattern; they currently cover a small set of pages.
7. **Use the empty fixtures/test-data folders** if shared seeded records would make tests less dependent on live data.

---

## 12. Detailed Test Inventory

Counts below are defined `test()` cases in each file. Loop-generated cases are noted where they matter.

| Platform | Feature | Test File | Scenarios Covered |
|----------|---------|-----------|-------------------|
| User | Auth setup | `tests/user/auth/auth.setup.ts` | One-time User login; saves session (not a product scenario) |
| User | Login | `tests/user/auth/login.spec.ts` | Login UI, success, email/password validation, invalid credentials, button/loading, API/network failure, forgot password, signup link, session, logout. OTP end-to-end skipped. Invalid-email loop adds extra runtime cases. |
| User | Signup | `tests/user/auth/signup.spec.ts` | Page load, required fields, empty submit, invalid email, short password, login navigation. Successful signup skipped. |
| User | Homepage UI | `tests/user/homepage/homepage-ui.spec.ts` | Load, sections, header, city selector, public/session, laptop/mobile |
| User | Homepage navigation | `tests/user/homepage/navigation.spec.ts` | Header, CTAs, footer, profile, mobile bottom nav |
| User | Homepage projects | `tests/user/homepage/projects.spec.ts` | Cards, details, compare toggle, carousel |
| User | Homepage notifications | `tests/user/homepage/notifications.spec.ts` | Icon, list/empty, open related project |
| User | Project listing | `tests/user/projects/project-listing.spec.ts` | Load, card content, public and authenticated access |
| User | Project search | `tests/user/projects/project-search.spec.ts` | Exact/partial/empty/no-results search |
| User | Project filters | `tests/user/projects/project-filters.spec.ts` | Status/config filters, combined filters, reset |
| User | Project compare | `tests/user/projects/project-compare.spec.ts` | Select, open, remove, clear, max 3 |
| User | Project navigation | `tests/user/projects/project-navigation.spec.ts` | Listing to details, homepage entry, Back, city selector |
| User | Project overview | `tests/user/project-details/project-overview.spec.ts` | Load, name/status/location, public access |
| User | Project information | `tests/user/project-details/project-information.spec.ts` | Config, area, price, possession, RERA, about |
| User | Project pricing | `tests/user/project-details/project-pricing.spec.ts` | Price display, range, EMI calculator |
| User | Project builder | `tests/user/project-details/project-builder.spec.ts` | Builder display and navigation |
| User | Project amenities | `tests/user/project-details/project-amenities.spec.ts` | Amenities section and list |
| User | Project media | `tests/user/project-details/project-media.spec.ts` | Hero, gallery, floor plans |
| User | Project documents | `tests/user/project-details/project-documents.spec.ts` | Downloads and brochure PDF |
| User | Site visit | `tests/user/project-details/actions/site-visit.spec.ts` | Button and unauthenticated gate |
| User | Site visit schedule | `tests/user/project-details/actions/site-visit-schedule.spec.ts` | Form, submit, enquiry created |
| User | Site visit validation | `tests/user/project-details/actions/site-visit-validation.spec.ts` | Required name/phone, 10-digit phone, optional fields |
| User | Request callback | `tests/user/project-details/actions/request-callback.spec.ts` | Modal, submit, Callback enquiry |
| User | Contact builder | `tests/user/project-details/actions/contact-builder.spec.ts` | Modal, submit, General enquiry |
| User | Contact channels | `tests/user/project-details/actions/contact-channels.spec.ts` | Share, Call, WhatsApp |
| User | Lead action gates | `tests/user/project-details/actions/lead-actions.spec.ts` | Sign-in required for gated actions |
| User | Builders listing | `tests/user/builders/builders-listing.spec.ts` | Public listing, sort, cards, open detail |
| User | Builder detail | `tests/user/builders/builder-detail.spec.ts` | Header, badge, stats, projects, compare |
| User | Compare page | `tests/user/compare/compare-page.spec.ts` | Compared projects, table, back navigation |
| User | Compare projects | `tests/user/compare/compare-projects.spec.ts` | Project link and remove control |
| User | Compare selection | `tests/user/compare/compare-selection.spec.ts` | Select, count, deselect, toggle |
| User | Compare validation | `tests/user/compare/compare-validation.spec.ts` | Empty, single, max 3, persistence, public access |
| User | Map | `tests/user/map/map-page.spec.ts` | Load, entry points, map UI, pins, public access |
| User | Notifications auth | `tests/user/notifications/notifications-auth.spec.ts` | Hidden when logged out; redirect; logged-in access |
| User | Notifications page | `tests/user/notifications/notifications-page.spec.ts` | Heading, grouping, content, project link, read-only |
| User | Shortlist auth | `tests/user/shortlist/shortlist-auth.spec.ts` | Hidden/redirect when logged out; save gated; logged-in access |
| User | Shortlist | `tests/user/shortlist/shortlist.spec.ts` | Save, appear on page, remove, persist, open project |
| User | Profile auth | `tests/user/profile/profile-overview/profile-overview-auth.spec.ts` | Hidden/redirect when logged out; logged-in access |
| User | Profile overview | `tests/user/profile/profile-overview/profile-overview.spec.ts` | Name, email, avatar, links, Sign out |
| User | Enquiries auth | `tests/user/profile/enquiries/enquiries-auth.spec.ts` | Redirect, logged-in access, profile entry |
| User | Enquiries page | `tests/user/profile/enquiries/enquiries-page.spec.ts` | List content, types, project links, read-only |
| User | Enquiries create | `tests/user/profile/enquiries/enquiries-create.spec.ts` | Site visit, callback, and general enquiries created |
| User | Messages auth | `tests/user/profile/messages/messages-auth.spec.ts` | Redirect, logged-in access, profile entry |
| User | Messages page | `tests/user/profile/messages/messages-page.spec.ts` | Conversation list and previews |
| User | Messages thread | `tests/user/profile/messages/messages-thread.spec.ts` | Thread, composer, send, persist |
| User | Saved searches auth | `tests/user/profile/saved-searches/saved-searches-auth.spec.ts` | Redirect, logged-in access, profile entry |
| User | Saved searches page | `tests/user/profile/saved-searches/saved-searches-page.spec.ts` | List, Notify toggle; Delete not exercised |
| User | Visits auth | `tests/user/profile/visits/visits-auth.spec.ts` | Redirect, logged-in access, profile entry |
| User | Visits page | `tests/user/profile/visits/visits-page.spec.ts` | Past visits, locality, status, project links |
| User | Legal privacy | `tests/user/legal/privacy.spec.ts` | Load, URL, footer/profile entry |
| User | Legal terms | `tests/user/legal/terms.spec.ts` | Load, URL, footer/profile entry |
| User | Legal data deletion | `tests/user/legal/data-deletion.spec.ts` | Load, URL, form controls present (no submit) |
| User | Accessibility | `tests/user/accessibility/accessibility.spec.ts` | Full-page, header, and WCAG-focused scans on sample pages |
| User | Visual | `tests/user/visual/visual-regression.spec.ts` | Full-page, element, and masked screenshot checks |
| Admin | Auth setup | `tests/admin/auth/auth.setup.ts` | One-time Admin login; saves session |
| Admin | Login | `tests/admin/auth/login.spec.ts` | UI, success, validation, denial, loading, session, sign out |
| Admin | Forgot password | `tests/admin/auth/forgot-password.spec.ts` | Request reset, confirmation, navigation |
| Admin | Reset password | `tests/admin/auth/reset-password.spec.ts` | Missing/invalid token UI. Successful update skipped. |
| Admin | Session gating | `tests/admin/auth/session-gating.spec.ts` | Protected routes require login (includes `/dashboard`, `/projects`, `/builders`, `/leads`, `/settings`) |
| Admin | Dashboard UI | `tests/admin/dashboard/dashboard-ui.spec.ts` | Metrics, follow-ups, visits, quick actions |
| Admin | Dashboard navigation | `tests/admin/dashboard/dashboard-navigation.spec.ts` | Metric and quick-action destinations |
| Admin | Shell | `tests/admin/dashboard/shell.spec.ts` | Sidebar, 17 module links, profile, navigation including Audit log and Settings |
| Admin | Builders list | `tests/admin/builders/builders-list.spec.ts` | List, columns, pagination, new/detail |
| Admin | Builders CRUD | `tests/admin/builders/builders-crud.spec.ts` | Create, validate, edit, soft-delete, logo upload |
| Admin | Projects list | `tests/admin/projects/projects-list.spec.ts` | List, columns, pagination, new/detail |
| Admin | Projects CRUD | `tests/admin/projects/projects-crud.spec.ts` | Create, validate, edit, soft-delete |
| Admin | Projects amenities | `tests/admin/projects/projects-amenities.spec.ts` | Select, persist, update, clear amenities |
| Admin | Projects media | `tests/admin/projects/projects-media.spec.ts` | Hero, gallery, floor plan, brochure, RERA upload |
| Admin | Units list | `tests/admin/units/units-list.spec.ts` | List, filters, pagination, new/detail |
| Admin | Units filters | `tests/admin/units/units-filters.spec.ts` | Combined project/status/config/price/carpet filter |
| Admin | Units CRUD | `tests/admin/units/units-crud.spec.ts` | Create, validate, edit, soft-delete |
| Admin | Units availability | `tests/admin/units/units-availability.spec.ts` | Status labels and filter options |
| Admin | Units media | `tests/admin/units/units-media.spec.ts` | Floor plan and photo upload |
| Admin | Pricing list | `tests/admin/pricing/pricing-list.spec.ts` | List, columns, record-price action |
| Admin | Pricing search | `tests/admin/pricing/pricing-search.spec.ts` | Search, no-match, reset |
| Admin | Pricing filters | `tests/admin/pricing/pricing-filters.spec.ts` | Project and price-range filters |
| Admin | Pricing CRUD | `tests/admin/pricing/pricing-crud.spec.ts` | Record project/unit price; no edit/delete |
| Admin | Pricing negative | `tests/admin/pricing/pricing-negative.spec.ts` | Negative/missing price, no-match search |
| Admin | Pricing regression | `tests/admin/pricing/pricing-regression.spec.ts` | Deep-link, case-insensitive search, combined filters |
| Admin | Availability list | `tests/admin/availability/availability-list.spec.ts` | List, columns, pagination, unit link |
| Admin | Availability filters | `tests/admin/availability/availability-filters.spec.ts` | Status, project, aging, clear |
| Admin | Availability quick change | `tests/admin/availability/availability-quick-change.spec.ts` | Status change, persist, round-trip |
| Admin | Availability negative | `tests/admin/availability/availability-negative.spec.ts` | Empty state, default filters, idempotent clear |
| Admin | Availability regression | `tests/admin/availability/availability-regression.spec.ts` | Deep-link, labels, aging badges |
| Admin | Leads list | `tests/admin/leads/leads-list.spec.ts` | List, search, filters, pagination, open detail |
| Admin | Leads CRUD | `tests/admin/leads/leads-crud.spec.ts` | Create, validate, edit, soft-delete |
| Admin | Leads detail | `tests/admin/leads/leads-detail.spec.ts` | Overview, sections, status, attachment |
| Admin | Leads activity | `tests/admin/leads/leads-activity.spec.ts` | Reassign, follow-up, callback, communication log |
| Admin | Leads cleanup | `tests/admin/leads/leads-cleanup.spec.ts` | Delete specified tester leads only |
| Admin | Pipeline list | `tests/admin/pipeline/pipeline-list.spec.ts` | Funnel, board, today’s actions |
| Admin | Pipeline filters | `tests/admin/pipeline/pipeline-filters.spec.ts` | Project filter and clear |
| Admin | Pipeline card | `tests/admin/pipeline/pipeline-card-detail.spec.ts` | Card opens lead detail |
| Admin | Pipeline today’s actions | `tests/admin/pipeline/pipeline-todays-actions.spec.ts` | Links to Reminders filters |
| Admin | Site visits list | `tests/admin/site-visits/site-visits-list.spec.ts` | List, filters, pagination, legend |
| Admin | Site visits CRUD | `tests/admin/site-visits/site-visits-crud.spec.ts` | Create, validate, edit, no delete |
| Admin | Site visits detail | `tests/admin/site-visits/site-visits-detail.spec.ts` | Detail, status, contact/project links |
| Admin | Reminders list | `tests/admin/reminders/reminders-list.spec.ts` | Grouped list, chips, counts, row content |
| Admin | Reminders filters | `tests/admin/reminders/reminders-filters.spec.ts` | All/Overdue/Today/Upcoming/Callbacks/Follow-ups |
| Admin | Reminders lifecycle | `tests/admin/reminders/reminders-lead-lifecycle.spec.ts` | Open lead, create/complete follow-up and callback |
| Admin | Verification list | `tests/admin/verification/verification-list.spec.ts` | Load, empty queues, tabs, builder link |
| Admin | Verification documents | `tests/admin/verification/verification-builder-document.spec.ts` | Uploaded document, open builder, approve |
| Admin | Reports list | `tests/admin/reports/reports-list.spec.ts` | Overview, default range, sales-rep metrics |
| Admin | Reports filters | `tests/admin/reports/reports-filters.spec.ts` | Project and date filters, clear |
| Admin | Reports activity | `tests/admin/reports/reports-sales-rep-activity.spec.ts` | Assignment increases activity count |
| Admin | Freshness list | `tests/admin/freshness/freshness-list.spec.ts` | List, counts, pagination |
| Admin | Freshness filters | `tests/admin/freshness/freshness-filters.spec.ts` | Entity type, stale age, paging, reset |
| Admin | Localities list | `tests/admin/localities/localities-list.spec.ts` | List, columns, create controls |
| Admin | Localities filters | `tests/admin/localities/localities-filters.spec.ts` | City, name, hide inactive, reset |
| Admin | Localities lifecycle | `tests/admin/localities/localities-lifecycle.spec.ts` | Create visible in Project dropdowns; deactivate/reactivate |
| Admin | Users | `tests/admin/users/users-list.spec.ts` | List load, columns, open detail |
| Cross-platform | Project visibility | `tests/cross-platform/admin-to-user-project-visibility.spec.ts` | Create/edit/hide/media/amenities reflected on User site |
| Cross-platform | Builder visibility | `tests/cross-platform/admin-to-user-builder-visibility.spec.ts` | Create, linked project, soft-delete |
| Cross-platform | Unit visibility | `tests/cross-platform/admin-to-user-unit-visibility.spec.ts` | Unit fields appear and update on User detail |
| Cross-platform | Site visit visibility | `tests/cross-platform/admin-to-user-site-visit-visibility.spec.ts` | Scheduled visit and status change on User visits |
| Cross-platform | Avatar visibility | `tests/cross-platform/admin-to-user-avatar-visibility.spec.ts` | Admin avatar upload on User profile |
| Cross-platform | Lead generation | `tests/cross-platform/user-to-admin-lead-generation.spec.ts` | Site visit, callback, contact builder → Admin lead and pipeline. WhatsApp skipped. Runtime adds 3 enquiry cases from one template. |
| API | Public read | `tests/api/public-read.spec.ts` | Anonymous read of projects, builders, localities; schema not exposed |
| API | Authenticated read | `tests/api/authenticated-read.spec.ts` | Token grant; user sees own data; admin can read another user; invalid token rejected; anonymous users list empty |

**Intentionally empty (no implemented tests):**

| Location | Notes |
|----------|-------|
| `tests/cross-platform/project-sync/` | Placeholder only |
| `tests/cross-platform/user-activity/` | Placeholder only |
| `tests/files/` | Placeholder only |
| `fixtures/` (admin, user, cross-platform) | Placeholder only |
| `test-data/admin`, `test-data/user`, `test-data/cross-platform` | Placeholder only |

---

*This document was produced from a review of the automation repository. It does not include credentials, environment values, or changes to existing tests.*
