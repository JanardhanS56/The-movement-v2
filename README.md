
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

**The Movement** addresses these vulnerabilities head-on with institutional-grade frontend guarantees. It is a fully functional, high-fidelity demo-complete frontend built with **Next.js 14**, **TypeScript (strict mode)**, and a privacy-first design philosophy. Every feature is designed to be backend-agnostic, with a strict API contract ready for Supabase integration.

The design tone is **serious, calm, direct, and trustworthy** — built for outdoor visibility and rapid mobile interaction.

---

## Key Features

### 1. Multi-Signature Announcements
Broadcast alerts require cryptographic threshold approval from multiple organizers before publication. Draft announcements appear in a **Pending Signatures** state and only go live once the required number of co-signatures is reached. This eliminates unilateral misinformation and unauthorized panic.

<img width="1892" height="991" alt="Screenshot 2026-11-02 063917" src="https://github.com/user-attachments/assets/9bafaf20-751c-4b34-aa7b-443e6bb21616" />

### 2. Privacy-Preserving Heatmaps
On-demand check-ins truncate coordinates to **3 decimal places (~110m)** before storage. Exact locations and individual paths are never recorded or mapped. The public heatmap endpoint returns only aggregated spatial centroids, ensuring volunteer safety while still providing valuable field intelligence.

<img width="1127" height="652" alt="Screenshot 2026-11-02 063836" src="https://github.com/user-attachments/assets/287fd1f4-4f8c-405c-8fe2-929f2cadb67d" />

### 3. Peer-Verified Task Board
Open community tasks require **multi-volunteer peer review consensus** or **organizer override** before impact points and badges are awarded. The task board supports a complete volunteer lifecycle: claim, withdraw, mark complete (with optional notes and canvas-sanitized photos), peer verification, and organizer review.

<img width="948" height="892" alt="image" src="https://github.com/user-attachments/assets/cf75193d-7be6-4fb8-a3e4-167a4572aae9" />

### 4. Public Impact Ledger
Deterministic, publicly verifiable profile records detail verified actions, peer verifiers, and earned badges. Every ledger entry is tamper-evident and links back to the original task, providing a permanent record of community contribution.

<img width="1248" height="905" alt="Screenshot 2026-11-02 063735" src="https://github.com/user-attachments/assets/1ea34ff0-e48b-4282-9154-b6222465923f" />

### 5. Real-Time Chat for Field Coordination
A complete, high-fidelity chat system with **cross-tab synchronization** via the native `BroadcastChannel` API. Features include 3 dedicated movement rooms, optimistic state updates, a curated 6-glyph reaction matrix, reply threading, @mentions, pinned messages, moderation controls, slow mode, and a task-sharing modal.

<img width="1892" height="991" alt="Screenshot 2026-11-02 063917" src="https://github.com/user-attachments/assets/2e27ac05-8801-4d4d-b695-4f5b25d1c8f5" />

### 6. Comprehensive Design System
A WCAG 2.2 AA compliant, dark-first palette with strict spacing scale, sub-pixel font smoothing, and high contrast. Accessible keyboard navigation, ARIA attributes, and focus-trap containment are baked into every component via shadcn/ui and Radix UI.

### 7. Demo-Ready Personas & Walkthrough
12 realistic fictional users with spread completion histories, leaderboard opt-in flags, and multiple organizer tiers. A built-in **Demo Panel** allows instant persona switching, and the **2-minute demo script** walks judges through every core feature without any setup.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | React Server Components for SEO shells, fast initial render, zero SSR crashes on Leaflet. |
| **Language** | TypeScript (Strict Mode) | Complete type safety, eliminating runtime null/undefined errors across asynchronous data boundaries. |
| **Design System** | Tailwind CSS + CSS Variables | WCAG 2.2 AA compliant palette (dark-first). Sub-pixel font smoothing and high contrast. |
| **Component Primitives** | shadcn/ui + Radix UI | Accessible keyboard navigation, ARIA attributes, and focus trap containment. |
| **Iconography** | lucide-react | Clear, semantic icons with explicit accessible titles and aria attributes. |
| **Data Validation** | Zod v4 | Strict schema validation across all inputs, claims, signatures, and mock adapters. |
| **State & Cache** | TanStack Query v5 | Declarative server-state caching, optimistic mutations, automatic retry, and cache invalidation. |
| **Mapping Engine** | Leaflet + react-leaflet v4 + leaflet.heat | OpenStreetMap tile layers with zero API keys. SSR-safe dynamic import wrapper. |
| **Test Engine** | Vitest | Lightning-fast pure logic and workflow integration testing. |
| **Bundle Analysis** | @next/bundle-analyzer | Continuous optimization of client JavaScript chunks and vendor dependencies. |

*Stack rationale sourced from the project's technology documentation*.

---

## Architecture & Adapter Pattern

The frontend is built against a **strict API contract** ([`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)) and uses an adapter pattern to decouple the UI from the backend implementation:

- **`MockApiAdapter` (Default)** — All operations execute in-browser with realistic seed data centered around **Mangalore, Karnataka**. This enables zero-setup demos and offline development.
- **`SupabaseStubAdapter`** — Activated via an environment flag, this stub throws `NotImplementedError` for any unimplemented backend call, preventing silent failures during the transition to production.

The adapter is selected at **build time** via `NEXT_PUBLIC_USE_MOCKS`, allowing Next.js to tree-shake mock data from production bundles.

```
src/lib/api/
├── index.ts          # Adapter selector (reads NEXT_PUBLIC_USE_MOCKS)
├── MockApiAdapter.ts # In-browser mock implementation
└── SupabaseStubAdapter.ts # Production stub (throws until implemented)
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

Create a `.env.local` file in the project root:

```bash
# Data Source Flag (Fixed at Build Time)
# Set to 'true' to use the client-side MockApiAdapter (default for demos)
# Set to 'false' to switch to SupabaseStubAdapter (for production)
NEXT_PUBLIC_USE_MOCKS=true

# Canonical Site URL
NEXT_PUBLIC_APP_URL=https://your-app-url.example

# Supabase Credentials (Required only when NEXT_PUBLIC_USE_MOCKS=false)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Important:** `NEXT_PUBLIC_USE_MOCKS` is evaluated at build time. Changing it requires a rebuild for the adapter switch to take effect.

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
| **Security Check** | 0 exposed secrets or sensitive files across tracked repository |
| **TypeScript** | Strict type checking with 0 type errors (`tsc --noEmit`) |
| **ESLint** | Next.js recommended rules with 0 warnings or errors (`next lint`) |
| **Unit & Integration Tests** | **60/60 passing** automated tests across 8 test suites (`vitest`) |
| **Production Build** | Static and dynamic route compilation with 0 build errors (`next build`) |
| **Quality Bans Audit** | 0 banned patterns (no em dashes, no `href="#"`, no TODO, no lorem ipsum, no raw `any`, no emojis, no unauthorized `localStorage` calls) across **143 source files** (`check-bans.mjs`) |
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

**Built with purpose. Designed for trust. Ready for the field.**
