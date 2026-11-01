# Implementation Progress: The Movement (Round 8 Final)

## Rules & Scope
- FRONTEND ONLY with fictional demo data.
- Design: Ivory background (`#F6F0E4`), ink text (`#060814`), Cobalt (`#0047FF` / `#2A63F5` in Phase 1), Acid Lime (`#D4FF24`), Tomato (`#FF4D2E`), Sun (`#FFB81C`), Lavender (`#C9B6FF`), Bricolage Grotesque + Instrument Serif italic.
- ONE phase at a time. Never guess. Stay in scope. No backend changes. No new dependencies.
- Quality gate: `npm run verify` must pass after every phase.

---

## Phase Status

- [x] **Phase 0: Read Only Audit & PROGRESS.md**
  - Status: DONE
  - Files Changed: `PROGRESS.md` (created)
  - Notes: Completed audit of real paths, seed UUIDs, and verification pipeline.

- [x] **Phase 1: Blue Tweak, Error State, Small Fixes**
  - Status: DONE
  - Files Changed: `tailwind.config.ts`, `scripts/contrast.mjs`, `src/app/globals.css`, `src/app/manifest.ts`, `src/app/layout.tsx`, `src/components/heatmap/LeafletMap.tsx`, `src/app/sign-up/page.tsx`, `src/components/shared/ErrorState.tsx`, `src/app/(dashboard)/feed/error.tsx`, `src/app/(dashboard)/tasks/error.tsx`, `src/app/(dashboard)/profile/[userId]/error.tsx`, `src/app/(dashboard)/tasks/page.tsx`, `src/components/tasks/TaskCard.tsx`, `src/lib/date.ts`, `src/components/profile/BadgeGallery.tsx`, `src/components/profile/ImpactLedger.tsx`, `src/components/profile/ProfileHeader.tsx`, `src/components/profile/ProfileNotFound.tsx`, `src/components/profile/ProfileView.tsx`
  - Notes: Calibrated cobalt to `#255DEE` passing WCAG AA (5.41:1 on white, 4.77:1 on ivory); rebuilt ErrorState with tomato corner bar accent, calm copy, and sanitized Zod/JSON display; wrapped tasks, feed, and profile in calm error boundaries; fixed duplicate "Created by you" badge in TaskCard; improved Tasks title and non-repetitive subtitle; enforced sentence case on Tasks and Profile headings; standardized clean date-time formatting e.g. "Apr 18, 2:40 PM". All 50 tests pass. Verified 0 build or lint errors.

- [x] **Phase 2: Demo Data and Pure Functions**
  - Status: DONE
  - Files Changed: `src/lib/mocks/fictional-data.ts` (created), `src/lib/mocks/seed-data.ts`, `src/lib/schemas/user.schema.ts`, `src/lib/__tests__/leaderboard-and-filters.test.ts` (created)
  - Notes: Added 12 fictional users with handles, avatars, showOnLeaderboards toggle, and spread completion records. Added task categories and metadata (estimatedMinutes, locationLabel, difficulty) for all tasks. Expanded SEED_TASKS to 14 tasks across all 5 statuses (Open, In progress, Pending verification, Completed, Cancelled). Implemented pure functions `getLeaderboard(period, now)`, `getUserByHandle`, `getBadgeProgress`, `getTaskCounts`, and `getFilteredTasks`. Wrote 10 comprehensive unit tests covering period filtering, tiebreak rule, leaderboard opt-out, badge evaluations, and multi-criteria task filtering. Verified with 60/60 passing tests and full production build.

- [x] **Phase 3: Tasks Leaderboard**
  - Status: DONE
  - Files Changed: `src/components/tasks/TasksLeaderboard.tsx` (created), `src/app/(dashboard)/tasks/page.tsx`
  - Notes: Added Leaderboard toggle pill beside status filters on /tasks with URL query persistence (`?view=leaderboard | tasks`) and filter preservation. Created TasksLeaderboard with 3 period tabs ("This month", "This year", "All time"), top 3 podium layout with custom SVG medals in token palette colors (Sun amber, Lavender, Acid lime), tabular numerals, ruled rows for ranks 4-10 with hover states, pinned "Your rank" summary card with points delta from #1, tie rule note, and Tier 3 expandable Organizer Recognition action panel with demo recognition toast. Fully responsive across 375px, 768px, and 1280px with 0 contrast or hydration errors.

- [x] **Phase 4: Task Board, Filter Rail and Sort**
  - Status: DONE
  - Files Changed: `src/components/tasks/TaskFilterRail.tsx` (created), `src/components/tasks/TaskFilterDrawer.tsx` (created), `src/app/(dashboard)/tasks/page.tsx`
  - Notes: Implemented desktop sticky left filter rail (280px, visible at 1024px+) and mobile bottom sheet drawer (<1024px) with matching count display. Wired all 7 filter controls (debounced text search with clear button, status, category, reward score, volunteer spots, when, difficulty) plus "Clear all filters" reset. Added 4 quick tabs ("All tasks", "Mine", "Saved", "Needs my verification") with live reactive counts. Added 4-option Sort dropdown (Soonest/Urgency, Highest points, Newest, Fewest spots left). Added friendly empty state with Reset Filters action. All filter parameters and sort orders persist in URL query parameters.

- [x] **Phase 5: Task Detail, Claim Flow, Board View, Saved**
  - Status: DONE
  - Files Changed: `src/lib/calendar.ts` (created), `src/lib/image-utils.ts` (created), `src/components/tasks/TaskBoardView.tsx` (created), `src/components/tasks/TaskDetailDrawer.tsx` (created), `src/components/tasks/TaskCard.tsx`, `src/lib/mocks/mock-store.ts`, `src/lib/api/types.ts`, `src/lib/api/mock-adapter.ts`, `src/lib/api/supabase-stub.ts`, `src/lib/ui-prefs.ts`, `src/app/(dashboard)/tasks/page.tsx`
  - Notes: Added List and Board view switcher next to Sort. Built 4 ruled columns Kanban board view with mobile horizontal snap scrolling. Built accessible TaskDetailDrawer (right slide-out on desktop, full-screen on mobile) triggered via card click or URL `?task=<UUID>`. Implemented full claim lifecycle with plain language checks: Claim task, Withdraw claim, Mark as done with optional note and optional canvas-processed photo (EXIF and GPS metadata stripped), Peer verification consensus bar with Approve and Reject (with reason confirmation), Tier 3 Organizer overrides and Task Cancellation. Added Save/Bookmark toggle to cards and drawer with storage persistence. Added real .ics calendar generation and export (`downloadTaskIcs`) and task link sharing. Verified with 0 errors across full verify pipeline.

- [x] **Phase 6: Profile Photo and Share Link**
  - Status: DONE
  - Files Changed: `src/lib/ui-prefs.ts`, `src/components/profile/PhotoCropDialog.tsx` (created), `src/components/profile/ProfileSettingsCard.tsx` (created), `src/components/profile/ProfileHeader.tsx`, `src/components/profile/ProfileView.tsx`, `src/components/profile/ProfileNotFound.tsx`, `src/components/tasks/TasksLeaderboard.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileTabBar.tsx`, `src/app/(dashboard)/u/[handle]/page.tsx` (created)
  - Notes: Added Change Photo and Remove Photo buttons with square crop preview dialog and zoom slider. Re-encoded through canvas to 512x512 stripping EXIF and GPS data with storage persistence in demo state and initials fallback. Updated avatar displays in ProfileHeader, Sidebar, and Leaderboard to reflect custom photos. Added Share Profile button beside movement organizer tag with Web Share API and clipboard copy (`Link copied` toast). Added new `/u/[handle]` dynamic route without breaking `/profile/[userId]`. Added profile settings card with "Who can see my profile" (Public vs Movement members only with gate) and "Show me on leaderboards" toggle. Removed visible raw UUIDs. Verified 0 errors across full verify pipeline.

- [x] **Phase 7: Badges (12)**
  - Status: DONE
  - Files Changed: `src/components/profile/BadgeGallery.tsx`, `src/lib/mocks/fictional-data.ts`, `src/lib/__tests__/leaderboard-and-filters.test.ts`, `src/components/profile/ProfileView.tsx`
  - Notes: Replaced generic star with 12 distinct inline SVG sticker badges styled from theme tokens (Cobalt, Acid Lime, Tomato, Sun Amber, Lavender, Ink, Ivory): First step (1 task), Getting going (5 tasks), Task master (15 tasks), Point collector (100 points), Point hero (500 points), Field eyes (5 check-ins), Co-signer (3 signatures), Team player (verify 3 tasks for others), Steady hands (tasks on 3 different days), Podium (monthly top 3), Champion (monthly or yearly), and Movement Founder. Earned badges render in full color with thick ink borders and drop shadows; locked badges render with muted dashed borders, lock icon, and progress bars (e.g. "2 of 5 tasks"). Heading displays "Badges" with sentence case and "N of 12 earned". Clicking any badge opens an accessible dialog with description and progress metrics. Unlocked badges trigger a session toast notification once per badge per session. All 60 tests pass; Next.js build passes cleanly.

- [x] **Phase 8: Sidebar and Top Bar (Core)**
  - Status: DONE
  - Files Changed: `src/components/layout/MovementSwitcher.tsx` (created), `src/components/layout/CommandPalette.tsx` (created), `src/components/layout/NotificationInbox.tsx` (created), `src/components/layout/UserMenu.tsx` (created), `src/components/layout/ShortcutsDialog.tsx` (created), `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx` (created), `src/components/layout/MobileTabBar.tsx`, `src/app/(dashboard)/layout.tsx`, `src/lib/mocks/fictional-data.ts`
  - Notes: Added Movement Switcher at the top of the sidebar with 2 fictional movements ("Coastal Action Front" and "Metro Solidarity Network") with sessionStorage persistence. Added 3 task sub-links under Tasks with live counts ("My tasks", "Saved", "Needs my verification") linking to matching tabs, hidden when count is 0, collapsing when sidebar is collapsed. Added Ctrl/Cmd+K Command Palette indexing pages, tasks, and members with keyboard navigation. Added Notification Bell with dynamic counts derived from pending announcements awaiting signature and tasks awaiting peer verification. Added "Needs you" count chips on Feed and Tasks. Added bottom User Menu with text size selector (Small, Normal, Large), Discreet Mode toggle (hides photos, sets tab title to "Notes"), keyboard shortcuts modal, and sign out. Added mobile bottom tab bar with 4 primary tabs plus 5th "More" menu with min 44px tap targets.

- [x] **Phase 9: Sidebar and Top Bar (Safety and Support)**
  - Status: DONE
  - Files Changed: `src/components/layout/SupportDialog.tsx` (created), `src/components/layout/TopBar.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileTabBar.tsx`
  - Notes: Added "Support the movement" modal with payee details area and an accessible decorative SVG QR code boldly watermarked "Demo QR, not scannable" and explicit note that no real donations or payments are processed. Added "Report from the field" quick action in sidebar linking directly to heatmap check-in. Added Quick Exit button and double-Escape keyboard listener clearing sessionStorage and redirecting via `window.location.replace("https://weather.com")` with accessible tooltip disclaimer. Added reactive offline status banner appearing whenever `navigator.onLine === false`.

- [x] **Phase 10: Verify Media (Honest Demo, Feed Page)**
  - Status: DONE
  - Files Changed: `src/components/feed/VerifyMediaDialog.tsx` (created), `src/app/(dashboard)/feed/page.tsx`
  - Notes: Added "Verify media" button directly beside "New announcement" in Feed page header. Implemented accessible VerifyMediaDialog with drag-and-drop zone and "Choose image" button, clean object URL previewing with automatic revocation on close. Added explicit disclaimers: "Demo only. No analysis ran." with zero mention of real AI services. Built deterministic evaluation algorithm based on filename and size returning one of 4 non-binary categories: 1) Verified original (lime fill, ink text), 2) Unverified but unmodified (outlined), 3) Flagged for community review (amber fill), and 4) High manipulation detected (tomato fill, white text). Included interactive "See example results" row allowing instant testing of all 4 outcome states. Added "Add community context" textarea persisted in demo sessionStorage. Verified with full verify pipeline.

- [x] **Phase 11: Impact Card (Profile Page)**
  - Status: DONE
  - Files Changed: `src/components/profile/ImpactCardDialog.tsx` (created), `src/components/profile/ProfileHeader.tsx`
  - Notes: Added "Share impact" button in ProfileHeader near the member name. Built 1080x1920 poster generation engine using the native HTML5 Canvas API awaiting `document.fonts.ready`. Extracted all palette tokens dynamically from CSS variables (Ivory, Ink, Lime, Cobalt, Sun Amber). Content includes The Movement logo monogram, member display name, @handle, tier badge, big tabular numerals for tasks completed and ledger impact points, up to 2 earned badge cards with descriptions, and the profile link using the `/u/[handle]` URL. Enforced privacy check where member photo is drawn only when profile visibility is set to Public; otherwise falls back to clean initials circle. Provided modal preview with "Download image" (`canvas.toBlob`), "Copy link", and calm error state on failure. Verified with full verify pipeline.

- [x] **Phase 12: Final Audit**
  - Status: DONE
  - Files Changed: `README.md`, `PROGRESS.md`
  - Notes: Conducted complete final audit. Re-verified token colors, font families, and contrast ratios (all 17 pairs PASS WCAG 2.1 AA). Verified spacing scale adherence (4, 8, 12, 16, 24, 32, 48, 64, 96), single container card hierarchies, and sentence case headings. Executed check:bans verifying 0 em dashes, 0 raw ANY casts, 0 emojis, and 0 illegal localStorage accesses across 143 files in src/. Tested keyboard accessibility across all drawers, sheets, and dialogs. Audited Tasks and Profile pages at 375px, 768px, and 1280px breakpoints. Updated README.md with comprehensive "Implemented features" and "Needs backend later" specifications. Full verify toolchain passes with 0 errors.

---

## Open Issues / Noticed, Not Fixed
- None in previous rounds.

---

## Chat Feature: Implementation Progress

### Rules & Scope (Chat Feature)
- FRONTEND ONLY with fictional demo data. Single new route: `/chat`.
- No new dependencies. No backend logic, no real WebSocket/Supabase code.
- Emoji reactions: Fixed set of 6 Unicode emoji keys (`thumbs_up`, `heart`, `thanks`, `celebrate`, `laugh`, `surprised`). No emoji anywhere else in the UI.
- Honesty banner on demo scope and privacy disclaimers required.
- Derive state purely from messages and demo state.
- Quality gate: `npm run verify` must pass after every phase.

### Chat Phase Status

- [x] **Phase 0: Read Only Audit & PROGRESS.md**
  - Status: DONE
  - Files Changed: `PROGRESS.md` (updated)
  - Notes: Completed comprehensive read-only audit of components, layout, state, tokens, drawer, and verification scripts.

- [ ] **Phase 1: Chat API Layer and Pure Functions (no UI)**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending user confirmation to proceed.

- [ ] **Phase 2: Chat Page (core)**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending.

- [ ] **Phase 3: Replies, Mentions, Reactions, Pin**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending.

- [ ] **Phase 4: Safety and Control**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending.

- [ ] **Phase 5: Room Tools**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending.

- [ ] **Phase 6: Sidebar Extras and Audit**
  - Status: NOT DONE
  - Files Changed: None
  - Notes: Pending.
