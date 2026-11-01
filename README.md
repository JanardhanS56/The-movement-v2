# The Movement

> A decentralized trust engine for civic volunteers and community organizers coordinating verified announcements, privacy-preserving field check-ins, and peer-verified community tasks.

---

## 1. Overview & Purpose

Modern civic movements and field coordination efforts face three critical vulnerabilities:
1. **Misinformation & Unauthorized Panic:** Fake broadcasts or unverified alerts spread rapidly across messaging groups.
2. **Location Exposure & Safety Risks:** Real-time volunteer tracking exposes physical safety and privacy.
3. **Accountability & Trust Gaps:** Contributions, bounties, and field tasks lack tamper-evident verification.

**The Movement** addresses these vulnerabilities directly with institutional-grade frontend guarantees:
- **Multi-Signature Announcements:** Broadcast alerts require cryptographic threshold approval from multiple organizers before publication.
- **Privacy-Preserving Heatmaps:** On-demand check-ins truncate coordinates to ~110m (3 decimal places). Exact locations and individual paths are never recorded or mapped.
- **Peer-Verified Task Board:** Open community tasks require multi-volunteer peer review consensus or organizer override before impact points and badges are awarded.
- **Public Impact Ledger:** Deterministic, publicly verifiable profile records detailing verified actions, peer verifiers, and earned badges.

**Design Tone:** Serious, calm, direct, trustworthy. Built for outdoor visibility and rapid mobile interaction.

---

## 2. Technology Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | React Server Components for SEO shells, fast initial render, zero SSR crashes on Leaflet. |
| **Language** | TypeScript (Strict Mode) | Complete type safety, eliminating runtime null/undefined errors across asynchronous data boundaries. |
| **Design System** | Tailwind CSS + CSS Variables | WCAG 2.2 AA compliant palette (dark-first). Sub-pixel font smoothing and high contrast. |
| **Component Primitives**| shadcn/ui + Radix UI | Accessible keyboard navigation, ARIA attributes, and focus trap containment. |
| **Iconography** | lucide-react | Clear, semantic icons with explicit accessible titles and aria attributes. |
| **Data Validation** | Zod v4 | Strict schema validation across all inputs, claims, signatures, and mock adapters. |
| **State & Cache** | TanStack Query v5 | Declarative server-state caching, optimistic mutations, automatic retry, and cache invalidation. |
| **Mapping Engine** | Leaflet + react-leaflet v4 + leaflet.heat | OpenStreetMap tile layers with zero API keys. SSR-safe dynamic import wrapper. |
| **Test Engine** | Vitest | Lightning-fast pure logic and workflow integration testing (37 tests across 6 suites). |
| **Bundle Analysis** | @next/bundle-analyzer | Continuous optimization of client JavaScript chunks and vendor dependencies. |

---

## 3. Installation & Local Development

### Prerequisites
- Node.js 18.17.0 or higher
- npm 9.0.0 or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Verification Suite
Run the comprehensive verification toolchain (typecheck, linter, tests, production build, bans check):
```bash
npm run verify
```

### 4. Bundle Analysis
Inspect webpack bundle distribution and chunk sizes:
```bash
npm run analyze
```

---

## 4. Environment Variables & Adapter Architecture

Create a `.env.local` file in the project root:

```bash
# Data Source Flag (Fixed at Build Time)
# Set to 'true' to use the client-side MockApiAdapter (default for demos and prototype testing)
# Set to 'false' to switch to SupabaseStubAdapter (for production backend integration)
NEXT_PUBLIC_USE_MOCKS=true

# Canonical Site URL
NEXT_PUBLIC_APP_URL=https://REPLACE_ME.example

# Supabase Credentials (Required only when NEXT_PUBLIC_USE_MOCKS=false)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Mock Adapter vs. Supabase Behavior
- **`NEXT_PUBLIC_USE_MOCKS=true` (Default):** All operations execute in-browser via `MockApiAdapter` and `mockStore`. Realistic seed data centered around Mangalore, Karnataka is provided out of the box.
- **`NEXT_PUBLIC_USE_MOCKS=false`:** Disables mock data and activates `SupabaseStubAdapter`. Any unimplemented backend call throws `NotImplementedError`, preventing silent failures.
- **Build-Time Constant:** `NEXT_PUBLIC_USE_MOCKS` is evaluated at build time by Next.js to enable tree-shaking of mock data in production builds.

---

## 5. Backend Integration Requirements (For Backend Teammates)

Backend teammates own the database, RLS policies, migrations, and real authentication. The frontend relies exclusively on the contract defined in [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md):

1. **Authentication:** Implement Supabase Auth (magic link / OTP). Edge middleware in `src/middleware.ts` will validate the session cookie and populate user claims.
2. **Row Level Security (RLS):**
   - Announcements: Published announcements are readable by all movement members; drafts are restricted to the author and Tier 3 organizers.
   - Tasks: Claiming tasks requires transactional concurrency locks to prevent over-subscription beyond `required_volunteers`.
   - Verifications: Claimants must be blocked by database constraints from verifying their own tasks.
3. **Privacy Enforcements (Backend Responsibility):**
   - Check-in coordinates must be truncated to 3 decimal places (~110m) in Postgres triggers before storage.
   - The public heatmap endpoint must return aggregated spatial centroids only (`aggregated_heatmap_view`). Individual coordinate rows must never be queried by clients.

---

## 6. Known Limitations

- **In-Memory State Persistence:** In demo mode (`NEXT_PUBLIC_USE_MOCKS=true`), mutations persist during the session but reset to initial seed data on full browser refresh. To restore seed data manually at any time, use the **Reset demo data** button in the Demo Panel.
- **Simulated Real-Time:** In mock mode, real-time updates across multiple tabs are simulated via TanStack Query cache invalidations rather than active Supabase Realtime WebSockets.

---

## 7. 2-Minute Demo Script (Mangalore Organizer Walkthrough)

Follow this step-by-step walkthrough to exercise all core platform features in under two minutes:

1. **Sign In as Lead Organizer:**
   - Navigate to `/sign-in`.
   - Select **Priya Rao** (Tier 3 Organizer, Mangalore chapter).
   - You will be redirected to `/feed`. Notice the active Tier 3 badge in the sidebar and header.
2. **Draft a Multi-Signature Announcement:**
   - In `/feed`, tap **New Announcement**.
   - Enter Title: `Emergency Coastal Alert`, Body: `High tide advisory for Zone B stewards. Secure water supplies immediately.`, Required Signatures: `2`.
   - Submit the dialog. Notice the announcement appears in **Pending Signatures** with `1 / 2 Signed` (author auto-signed on creation).
3. **Co-Sign as Co-Organizer:**
   - In the bottom-right **Demo Panel**, expand controls and switch persona to **Rohan Shetty** (Tier 3 Organizer).
   - Tap **Sign Bulletin** on the pending announcement and confirm the alert dialog.
   - The announcement reaches the threshold (`2 / 2 Signed`), transitions to **Verified Announcements Feed**, and displays the verified shield emblem.
4. **Field Telemetry Check-in:**
   - Navigate to `/heatmap`. Observe 40 aggregated check-in points near Mangalore.
   - Tap the bottom-right **Check In Here** button (48px height).
   - Your location is truncated to 3 decimals (~110m) and immediately renders your electric blue indicator. No individual coordinates of other users are shown.
5. **Volunteer Task Claim & Completion:**
   - In the Demo Panel, switch persona to **Sneha Nayak** (Tier 1 Volunteer).
   - Navigate to `/tasks`. Select the filter **Open**.
   - Tap **Claim Task** on `Water Station Distribution Setup` (40 pts). The claim updates optimistically.
   - Tap **Mark Complete**, enter a field note, and submit. The task moves to `pending_verification`.
6. **Peer Review & Verification:**
   - In the Demo Panel, switch persona back to **Priya Rao** (Tier 3 Organizer).
   - On the same task card, tap **Verify Task Claim**.
   - Choose **Organizer Override (Approve)** and confirm.
   - The task transitions to **Completed** with distinct ledger styling.
7. **Inspect Public Impact Ledger:**
   - In the Demo Panel, switch back to **Sneha Nayak**.
   - Click **My Profile** in the sidebar (navigating to `/profile/66666666-6666-6666-6666-666666666666`).
   - Observe Sneha's earned badge (`Water Station Distribution Setup Champion`), validated impact points (+40 pts), and the permanent ledger entry linking to `/tasks`.

---

## 8. Repository File Tree

```
├── docs/
│   └── API_CONTRACT.md             # Full frontend/backend REST, RPC, RLS specification
├── public/
│   ├── apple-touch-icon.png        # 180x180 branded PNG icon
│   ├── favicon.svg                 # SVG browser tab icon
│   ├── icon.svg                    # Scalable app emblem
│   ├── manifest.json               # Web app manifest
│   ├── robots.txt                  # Search crawler directives
│   ├── sitemap.xml                 # Static sitemap
│   └── leaflet/                    # Local Leaflet marker assets
├── scripts/
│   ├── analyze.mjs                 # Cross-platform bundle analyzer trigger
│   ├── check-bans.mjs              # Quality gate enforcement (bans em dashes, TODOs, emojis, etc.)
│   └── contrast.mjs                # WCAG 2.2 AA relative luminance calculator
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── feed/page.tsx       # Multi-Sig Announcement feed
│   │   │   ├── heatmap/page.tsx    # SSR-safe check-in heatmap
│   │   │   ├── profile/[userId]/   # RSC shell for volunteer profile
│   │   │   ├── tasks/page.tsx      # Bounty board with URL filter params
│   │   │   └── layout.tsx          # Authenticated shell layout
│   │   ├── not-found.tsx           # Custom 404 page
│   │   ├── privacy/page.tsx        # Legal draft privacy policy
│   │   ├── sign-in/page.tsx        # Persona selection & demo auth
│   │   ├── terms/page.tsx          # Legal draft terms of service
│   │   ├── globals.css             # Theme tokens and WCAG 2.2 variables
│   │   ├── layout.tsx              # Root HTML shell with canonical URL and metadata
│   │   └── page.tsx                # Public landing page
│   ├── components/
│   │   ├── feed/                   # Announcement cards, dialogs, signature chips
│   │   ├── heatmap/                # LeafletMap, dynamic HeatmapView, MapSkeleton
│   │   ├── layout/                 # Collapsible Sidebar and MobileTabBar
│   │   ├── profile/                # ProfileView, Header, Stats, BadgeGallery, ImpactLedger
│   │   ├── providers/              # AuthProvider, QueryProvider, DemoPanel
│   │   ├── shared/                 # EmptyState, ErrorAlert, PageHeader, TierBadge, UserAvatar
│   │   ├── tasks/                  # TaskCard, ClaimTaskDialog, CreateTaskDialog, VerifyTaskDialog
│   │   └── ui/                     # shadcn/ui accessible components
│   ├── lib/
│   │   ├── api/                    # ApiClient, MockApiAdapter, SupabaseStubAdapter
│   │   ├── mocks/                  # Seed data and in-memory mock store
│   │   ├── schemas/                # Zod schemas (User, Task, Announcement, CheckIn, Badge, Ledger)
│   │   ├── __tests__/              # Vitest test suites (Date, Permissions, Feed, Tasks, Heatmap, Profile)
│   │   ├── date.ts                 # Deterministic UTC date formatters
│   │   ├── permissions.ts          # Pure authorization rules table
│   │   ├── query-keys.ts           # Centralized TanStack Query cache keys
│   │   └── utils.ts                # Tailwind class merge utility
│   └── types/
│       └── leaflet-heat.d.ts       # Typed declaration for leaflet.heat
├── next.config.mjs                 # Next.js configuration with bundle analyzer
├── package.json                    # Project scripts and dependencies
├── tailwind.config.ts              # Custom design tokens configuration
└── tsconfig.json                   # Strict TypeScript compiler options
```

---

## 9. Planned Features (Post-MVP)

- **Bounty Overbooking (+20% Capacity):** Allow slight volunteer over-subscription to compensate for field attrition.
- **Web Push Notifications:** Real-time push alerts for pending organizer multi-sig authorization requests.
- **PWA Service Worker:** Offline tile caching and background queueing for field check-ins in low-connectivity areas.
- **Liquid Democracy Delegation:** Allow Tier 2 volunteers to delegate verification votes to domain specialists (e.g., medical stewards).
- **Automated EXIF Stripping:** Client-side canvas sanitization to strip GPS metadata from photo evidence prior to upload.

---

## 10. Remaining Work by Owner

### Frontend Owner (Complete)
- [x] All 8 application phases implemented and SSR-safe.
- [x] Zero hydration errors, zero ESLint warnings, zero TypeScript errors.
- [x] 100% test pass rate across 37 automated tests.
- [x] Quality bans audit passing with 0 findings across all 90 source files.

### Backend Teammates (Pending)
- [ ] Deploy Supabase project and apply Postgres schema migrations.
- [ ] Configure database triggers for multi-sig publication thresholds.
- [ ] Implement Row Level Security (RLS) policies specified in `docs/API_CONTRACT.md`.
- [ ] Implement coordinate truncation triggers and PostGIS spatial clustering views.
- [ ] Connect Next.js edge middleware to validate Supabase session cookies.

### Legal Review (Pending)
- [ ] Review draft `/privacy` policy and insert actual legal entity name, mailing address, and jurisdiction.
- [ ] Review draft `/terms` of service and confirm liability provisions for voluntary field activities.
- [ ] Finalize active legal contact email (`[LEGAL_CONTACT_EMAIL]`).
