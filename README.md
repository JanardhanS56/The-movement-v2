
# The Movement

> **A decentralized trust engine for civic volunteers and community organizers** — coordinating verified announcements, privacy-preserving field check-ins, and peer-verified community tasks.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Adapter Pattern](#architecture--adapter-pattern)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Demo](#running-the-demo)
- [Project Structure](#project-structure)
- [Quality Gates & Testing](#quality-gates--testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Modern civic movements and field coordination efforts face three critical vulnerabilities:

1. **Misinformation & Unauthorized Panic** — Fake broadcasts and unverified alerts spread rapidly across messaging groups.
2. **Location Exposure & Safety Risks** — Real-time volunteer tracking exposes physical safety and privacy.
3. **Accountability & Trust Gaps** — Contributions, bounties, and field tasks lack tamper-evident verification.

**The Movement** addresses these vulnerabilities head-on with institutional-grade architecture and decentralized trust mechanics. Built with **Next.js 14 (App Router)**, **TypeScript (strict mode)**, **Supabase PostgreSQL 15**, and **Supabase Realtime**, the platform provides complete end-to-end civic coordination. It features an append-only cryptographic commit audit ledger, automated multi-peer consensus triggers, 5-character movement invite codes, privacy-preserving check-in telemetry, and a fail-safe multi-tiered API adapter architecture.

The design tone is **serious, calm, direct, and trustworthy** — built for outdoor visibility and rapid mobile interaction.

---

## Key Features

### 1. Multi-Signature Announcements
Broadcast alerts require cryptographic threshold approval from multiple organizers before publication. Draft announcements appear in a **Pending Signatures** state and only go live once the required number of co-signatures is reached. This eliminates unilateral misinformation and unauthorized panic.

<img width="1892" height="991" alt="Screenshot 2026-11-02 063917" src="https://github.com/user-attachments/assets/9bafaf20-751c-4b34-aa7b-443e6bb21616" />

### 2. Privacy-Preserving Heatmaps
On-demand check-ins truncate coordinates to **3 decimal places (~110m)** before storage. Exact locations and individual paths are never recorded or mapped. The public heatmap endpoint returns only aggregated spatial centroids, ensuring volunteer safety while still providing valuable field intelligence.

<img width="1127" height="652" alt="Screenshot 2026-11-02 063836" src="https://github.com/user-attachments/assets/287fd1f4-4f8c-405c-8fe2-929f2cadb67d" />

### 3. Peer-Verified Task Board & Automated Quorum Resolution
Open community tasks require **multi-volunteer peer review consensus** (3 assigned verifiers, $\ge 2$ approvals required) or **organizer override** before impact points and badges are awarded. An automated PostgreSQL trigger (`check_peer_verification_quorum`) resolves claims in real-time, increments verified impact points, and awards milestone badges.

<img width="948" height="892" alt="image" src="https://github.com/user-attachments/assets/cf75193d-7be6-4fb8-a3e4-167a4572aae9" />

### 4. Ground Truth Transparency Audit Ledger
An append-only cryptographic commit ledger (`public.ground_truth_commits`) records verified milestones, task completions, and announcements with SHA-256 payload hashes and parent-link chains. Anyone can verify the integrity of movement operations directly on `/audit` or via `/api/ground-truth/[hash]`.

<img width="1248" height="905" alt="Screenshot 2026-11-02 063735" src="https://github.com/user-attachments/assets/1ea34ff0-e48b-4282-9154-b6222465923f" />

### 5. Persistent Real-Time Chat for Field Coordination
High-fidelity chat powered by Supabase Realtime WebSockets with automatic exponential backoff reconnection. Features 4 rooms (`everyone`, `urgent-needs`, `help-questions`, task-specific rooms), optimistic state updates, a 6-glyph reaction matrix, reply threading, @mentions, pinned messages, slow mode, and a volunteer moderation report pipeline (`/api/chat/reports`).

<img width="1892" height="991" alt="Screenshot 2026-11-02 063917" src="https://github.com/user-attachments/assets/2e27ac05-8801-4d4d-b695-4f5b25d1c8f5" />

### 6. 5-Character Movement Invite Codes & Quick Join
Movements generate 5-character uppercase alphanumeric invite codes (e.g., `MOV9K`, `HK26V`) with direct share links (`/join/[code]`). Volunteers can join in one click across desktop and mobile, immediately unlocking movement feeds, tasks, and chat channels.

### 7. Cloud Media Storage & Task Proofs
Cloud media uploads are provisioned via Supabase Storage buckets (`task-proofs` and `avatars`). Task proof photos are sanitized client-side via canvas EXIF-stripping before being uploaded via `/api/upload` (with size and MIME-type validation) or held in base64 fallback.

### 8. Full-Text Search & Server-Side Pagination
Full-text search powered by PostgreSQL GIN `to_tsvector` indexes on task and announcement titles and descriptions. Server-side cursor-based pagination protects API throughput and Supabase egress limits.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | React Server Components for SEO shells, Next.js API Route Handlers for full backend endpoints. |
| **Language** | TypeScript (Strict Mode) | Complete type safety, eliminating runtime null/undefined errors across asynchronous data boundaries. |
| **Backend & Database** | Supabase (PostgreSQL 15) | 13 production migrations, RLS policies, automated quorum & badge triggers, GIN full-text indexes. |
| **Realtime Sync** | Supabase Realtime (WebSocket) | Cross-client chat channel synchronization with automatic reconnection backoff. |
| **Cloud Storage** | Supabase Storage | S3-compatible asset storage for task completion proofs (`task-proofs`) and profile avatars (`avatars`). |
| **Design System** | Tailwind CSS + CSS Variables | WCAG 2.2 AA compliant palette (dark-first). Sub-pixel font smoothing and high contrast. |
| **Component Primitives** | shadcn/ui + Radix UI | Accessible keyboard navigation, ARIA attributes, and focus trap containment. |
| **Iconography** | lucide-react | Clear, semantic icons with explicit accessible titles and aria attributes. |
| **Data Validation** | Zod v4 | Strict schema validation across all inputs, claims, signatures, and API responses. |
| **State & Cache** | TanStack Query v5 | Declarative server-state caching, optimistic mutations, automatic retry, and cache invalidation. |
| **Mapping Engine** | Leaflet + react-leaflet v4 + leaflet.heat | OpenStreetMap tile layers with zero API keys. SSR-safe dynamic import wrapper. |
| **Test Engine** | Vitest | Comprehensive unit and integration test suite (90 passing tests across 12 test suites). |
| **Bundle Analysis** | @next/bundle-analyzer | Continuous optimization of client JavaScript chunks and vendor dependencies. |

---

## Architecture & Multi-Tier Adapter Pattern

The platform features a multi-tiered fail-safe data architecture:

- **`RestApiAdapter`** — Communicates with live Next.js Route Handlers (`/api/*`), executing mutations against Supabase PostgreSQL using service role transactions and strict RLS rules.
- **`FallbackApiAdapter` (Active Default)** — Wraps `RestApiAdapter`. If the remote Supabase database is paused, rate-limited, or unreachable, calls automatically fail over to an in-memory `MockApiAdapter` store without crashing or showing blank screens.
- **`SupabaseChatClient`** — Connects directly to Supabase Realtime WebSocket channels with local fallback to `BroadcastChannel` in offline environments.

```
src/lib/api/
├── index.ts              # Active adapter export (FallbackApiAdapter wrapping RestApiAdapter)
├── FallbackApiAdapter.ts # Resilient multi-tiered fallback adapter
├── rest-adapter.ts       # REST client for /api/* Next.js routes
├── MockApiAdapter.ts     # In-browser mock implementation with Mangalore seed data
├── chat.ts               # Chat service and Supabase Realtime client
└── client.ts             # Direct Supabase browser client helper
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17.0 or higher
- **npm** 9.0.0 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/sameer10237/The-movement.git
cd The-movement
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables)).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Run the Verification Suite

```bash
npm run verify
```

This runs the full quality pipeline: TypeScript typecheck, ESLint, Vitest test suite, production build, and the custom quality-bans audit.

### 6. Bundle Analysis (Optional)

```bash
npm run analyze
```

---

## Environment Variables

Create a `.env.local` file in the project root (see `.env.example`):

```bash
# Data Source Flag
# Set to 'false' to connect to live Supabase backend (default)
# Set to 'true' to force client-side MockApiAdapter
NEXT_PUBLIC_USE_MOCKS=false

# Canonical Site URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_PROJECT_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=postgresql://user:password@db.your-project.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-Side Only Service Role Key (used in Next.js Route Handlers)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Running the Demo

The application ships with a **2-minute demo script** designed for hackathon judges. No authentication or backend setup is required.

### Demo Walkthrough: Mangalore Organizer

1. **Sign In as Lead Organizer** — Navigate to `/sign-in` and select **Janardhan** (Tier 3 Organizer, Mangalore chapter). You will be redirected to `/feed`.
2. **Draft a Multi-Signature Announcement** — Tap **New Announcement**, enter a title and body, set `Required Signatures: 2`, and submit. The announcement appears in **Pending Signatures** with `1 / 2 Signed`.
3. **Co-Sign as Co-Organizer** — Use the **Demo Panel** to switch to another organizer and co-sign the announcement. It immediately moves to the **Verified Announcements Feed** with a shield emblem.
4. **Field Telemetry Check-In** — Navigate to `/heatmap`. Observe 40 aggregated check-in points near Mangalore. Tap **Check In Here** — your location is truncated to 3 decimals (~110m) and rendered as a blue indicator. No individual coordinates of other users are shown.
5. **Volunteer Task Claim & Completion** — Switch to **Sneha Nayak** (Tier 1 Volunteer), navigate to `/tasks`, filter by **Open**, claim "Water Station Distribution Setup" (40 pts), mark it complete with a field note, and submit.
6. **Peer Review & Verification** — Switch back to **Janardhan**, tap **Verify Task Claim**, choose **Organizer Override (Approve)**, and confirm. The task transitions to **Completed** with distinct ledger styling.
7. **Inspect Public Impact Ledger** — Switch to **Sneha Nayak**, click **My Profile**, and observe her earned badge, validated impact points (+40 pts), and the permanent ledger entry linking to `/tasks`.

*Full walkthrough details sourced from the project's demo documentation*.

---

## Project Structure

```
├── docs/
│   └── API_CONTRACT.md          # Full frontend/backend REST, RPC, RLS specification
├── public/
│   ├── apple-touch-icon.png     # 180x180 branded PNG icon
│   ├── favicon.svg              # SVG browser tab icon
│   ├── icon.svg                 # Scalable app emblem
│   ├── manifest.json            # Web app manifest
│   ├── robots.txt               # Search crawler directives
│   ├── sitemap.xml              # Static sitemap
│   └── leaflet/                 # Local Leaflet marker assets
├── scripts/
│   ├── analyze.mjs              # Cross-platform bundle analyzer trigger
│   ├── check-bans.mjs           # Quality gate enforcement (bans em dashes, TODOs, emojis, etc.)
│   └── contrast.mjs             # WCAG 2.2 AA relative luminance calculator
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── feed/page.tsx    # Multi-Sig Announcement feed
│   │   │   ├── heatmap/page.tsx # SSR-safe check-in heatmap
│   │   │   ├── profile/[userId]/ # RSC shell for volunteer profile
│   │   │   ├── tasks/page.tsx   # Bounty board with URL filter params
│   │   │   └── layout.tsx       # Authenticated shell layout
│   │   ├── not-found.tsx        # Custom 404 page
│   │   ├── privacy/page.tsx     # Legal draft privacy policy
│   │   ├── sign-in/page.tsx     # Persona selection & demo auth
│   │   ├── terms/page.tsx       # Legal draft terms of service
│   │   ├── globals.css          # Theme tokens and WCAG 2.2 variables
│   │   ├── layout.tsx           # Root HTML shell with canonical URL and metadata
│   │   └── page.tsx             # Public landing page
│   ├── components/
│   │   ├── feed/                # Announcement cards, dialogs, signature chips
│   │   ├── heatmap/             # LeafletMap, dynamic HeatmapView, MapSkeleton
│   │   ├── layout/              # Collapsible Sidebar and MobileTabBar
│   │   ├── profile/             # ProfileView, Header, Stats, BadgeGallery, ImpactLedger
│   │   ├── providers/           # AuthProvider, QueryProvider, DemoPanel
│   │   ├── shared/              # EmptyState, ErrorAlert, PageHeader, TierBadge, UserAvatar
│   │   ├── tasks/               # Task board, filters, detail drawer, leaderboard
│   │   └── ...
│   ├── lib/
│   │   ├── api/                 # Adapter pattern (MockApiAdapter, SupabaseStubAdapter)
│   │   ├── mock/                # Seed data, mock store
│   │   └── utils/               # Pure utility functions
│   └── types/
│       └── leaflet-heat.d.ts    # Typed declaration for leaflet.heat
├── next.config.mjs              # Next.js configuration with bundle analyzer
├── package.json                 # Project scripts and dependencies
├── tailwind.config.ts           # Custom design tokens configuration
└── tsconfig.json                # Strict TypeScript compiler options
```

*File tree adapted from the repository structure*.

---

## Quality Gates & Testing

The codebase passes **all automated verification checks** with zero errors:

| Check | Result |
|---|---|
| **Security Check** | 0 exposed secrets or sensitive files across 263 tracked files in repository |
| **TypeScript** | Strict type checking with 0 type errors (`tsc --noEmit`) |
| **ESLint** | Next.js recommended rules with 0 warnings or errors (`next lint`) |
| **Unit & Integration Tests** | **90/90 passing** automated tests across 12 test suites (`vitest`) |
| **Production Build** | Static and dynamic route compilation with 0 build errors (`next build`) |
| **Quality Bans Audit** | 0 banned patterns across source files (`check-bans.mjs`) |
| **WCAG 2.1 AA Contrast** | All color pairs verified compliant (`scripts/contrast.mjs`) |

*Verification metrics sourced from the project's final quality gate report*.

---

## Contributing

This project was built for a hackathon, but contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Follow the existing code style (strict TypeScript, no `any`, no emojis in code, no em dashes in source files).
4. Run the verification suite: `npm run verify`.
5. Open a pull request with a clear description of the change.

> **Note:** The repository enforces strict quality gates via `check-bans.mjs`. Ensure your code passes all checks before submitting a PR.

---

## License

This project is licensed under the terms included in the [LICENSE](LICENSE) file.


## Acknowledgments

- **Next.js**, **Tailwind CSS**, **shadcn/ui**, **Radix UI**, **TanStack Query**, **Zod**, **Leaflet**, and **Vitest** — for the incredible open-source ecosystem.
- **OpenStreetMap** — for providing free, open map tiles.
- **Hackathon organizers and mentors** — for the opportunity to build technology for social good.

---

Live link: https://the-movement-tau.vercel.app

**Built with purpose. Designed for trust. Ready for the field.**
