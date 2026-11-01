# The Movement — A Trust Engine for Collective Action

> A Progressive Web App that brings institutional-grade accountability to grassroots organizing.

---

## What is The Movement?

Modern social movements face three critical challenges:

**1. Misinformation** — False announcements spread through groups, causing chaos and eroding trust.  
**2. Coordination gaps** — Organizers don't know where their people are or how many showed up.  
**3. Volunteer accountability** — There's no tamper-evident record of who did what.

**The Movement** solves all three with a decentralized trust engine:

- Announcements require multiple organizer signatures before going public.
- A live GPS heatmap shows real-time crowd density — no app install required.
- Tasks are publicly posted, claimed by volunteers, and verified by peers before credit is awarded.
- A public Impact Ledger makes every contribution permanently visible and verifiable.

---

## Core Features (MVP — Phase 1)

### 1. Multi-Sig Announcement Feed

Organizers draft announcements. Before an announcement goes public, it requires a configured number of digital signatures (e.g., 2 out of 3 co-organizers must sign). A PostgreSQL trigger automatically publishes the announcement the moment the threshold is met — atomically, with no race conditions.

**Demo flow:**
- Alex drafts "March moved to Sunday" (requires 2 signatures)
- Alex auto-signs on creation (1/2 done)
- Jordan signs → announcement publishes instantly to all members

### 2. Live Check-in Heatmap

Volunteers click **"Check In Here"**. The browser's native `navigator.geolocation` API captures their GPS coordinates — no third-party geolocation service, no API key. A Supabase Realtime WebSocket pushes the new coordinate to every connected client, where `leaflet.heat` renders a glowing red/orange density blob on an OpenStreetMap base layer.

**Result:** Organizers see where their people are concentrated, in real-time, from any device.

### 3. Bounty Board — Task Claim & Peer Verification

Organizers post tasks (e.g., "Distribute flyers at Central Park — 150 points"). Any movement member can claim a task. When they mark it complete, three random peers are assigned to verify. If 2 out of 3 approve, the task is marked verified and a badge is automatically issued. Organizers can also override and verify directly.

### 4. Impact Ledger / Badge Profile

Every verified contribution is permanently recorded in a public profile page. Badges show whether they were earned via Peer Vote or Organizer Override — making the verification method transparent. The profile is server-rendered for fast loading and full SEO indexability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 15 via Supabase |
| Real-time | Supabase Realtime (WebSocket) |
| Auth | Supabase Auth (magic link / email) |
| Storage | Supabase Storage (document uploads) |
| Map | react-leaflet + leaflet.heat (OpenStreetMap — no API key) |
| Data Fetching | TanStack Query v5 |
| Validation | Zod |
| PWA | next-pwa (Service Worker) |
| Deployment | Vercel (free tier) |

---

## Local Development Setup

### Prerequisites

- Node.js 18 or later
- A free [Supabase](https://supabase.com) account (create a new project)
- A free [Vercel](https://vercel.com) account (optional, for preview deploys)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/the-movement.git
cd the-movement
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in the values from your Supabase project dashboard (Settings → API):

```bash
# .env.local

# Supabase — found in Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Service role key — NEVER commit this, NEVER expose to client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Warning:** `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. It must only be used in server-side Route Handlers. Never import it into a client component.

### 4. Set up the database

1. Open your Supabase project → SQL Editor.
2. Run the migrations in the order specified in [`database-schema.md`](./database-schema.md) (Section 8: Migration Order).
3. Apply all tables, triggers, functions, RLS policies, and indexes.
4. Run the seed data SQL to create the test movement and sample tasks.

### 5. Configure Supabase Storage

In your Supabase Dashboard → Storage:
- Create a bucket named `documents`
- Set it to **Private** (not public)

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Personas

Use these test accounts to explore all user tiers. All use the password `demo1234`.

| Name | Email | Tier | Role |
|---|---|---|---|
| Alex Rivera | alex@demo.test | 3 — Organizer | Lead Organizer. Can draft announcements, post tasks, override verifications. |
| Jordan Lee | jordan@demo.test | 3 — Organizer | Co-Organizer. Can co-sign announcements. |
| Sam Patel | sam@demo.test | 3 — Organizer | Co-Organizer. Can co-sign announcements. |
| Casey Kim | casey@demo.test | 2 — Sr. Volunteer | Can claim tasks, check in, act as peer verifier. |
| Morgan Chen | morgan@demo.test | 1 — Volunteer | Can claim tasks, check in, act as peer verifier. |

> **Note:** In the demo, any user can upload any file at `/onboarding` and be auto-upgraded to Tier 3. This is intentional — it's the mock identity flow described in [`database-schema.md`](./database-schema.md#6-mock-auth-flow).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup, onboarding pages
│   ├── (dashboard)/      # Protected app pages (sidebar layout)
│   │   ├── feed/         # Multi-Sig Announcement Feed
│   │   ├── heatmap/      # Live Check-in Heatmap
│   │   ├── tasks/        # Bounty Board
│   │   └── profile/      # Badge Profile (public)
│   └── api/              # Route Handlers (server-side mutations)
├── components/           # React components by feature
├── lib/
│   ├── supabase/         # Supabase client helpers
│   ├── schemas/          # Zod schemas for all data types
│   └── types/            # TypeScript interfaces
└── hooks/                # Custom React hooks
```

---

## Documentation

| File | Purpose |
|---|---|
| [`README.md`](./README.md) | You are here — onboarding and setup |
| [`implementation-plan.md`](./implementation-plan.md) | Sprint-by-sprint development guide, feature implementation details, Phase 2 scratchpad |
| [`ui-plan.md`](./ui-plan.md) | Frontend architecture, design system, library mandates, accessibility rules |
| [`database-schema.md`](./database-schema.md) | Full SQL schema, RLS policies, triggers, mock auth flow |
| [`architecture.md`](./architecture.md) | System design, boundary model, real-time flow, ADRs |

---

## Phase 2 (Future Features)

Phase 2 features are explicitly out of scope for the MVP. They are documented in [`implementation-plan.md`](./implementation-plan.md#6-scratchpad--phase-2-future-features). The database schema has been designed with JSONB flexibility columns to accommodate these features without requiring destructive migrations:

- **+20% Bounty Overbooking** — allow slight volunteer over-subscription
- **Reliability Scores** — rolling user trust metric influencing task assignment
- **Treasury Shadow Ledger** — track movement funds with double-entry accounting
- **Liquid Democracy** — delegate verification votes to trusted peers
- **EXIF Stripping** — protect volunteer privacy by stripping GPS from uploaded photos

---

## Contributing

This project was built for a hackathon. If you want to extend it:

1. Read all documentation files listed above before writing any code.
2. Follow the TypeScript + Zod rules in [`ui-plan.md`](./ui-plan.md#3-non-vibe-coded-mandates).
3. Write RLS policies for any new table (see [`database-schema.md`](./database-schema.md#4-row-level-security-rls-policies)).
4. Test with all 5 demo personas.

---

## License

MIT — see [LICENSE](./LICENSE).
