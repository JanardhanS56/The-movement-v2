# Implementation Plan — The Movement: A Trust Engine for Collective Action

> **Version:** 1.0 — MVP Scope  
> **Last Updated:** 2026-11-01  
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Phase Definition](#2-phase-definition)
3. [Technical Prerequisites](#3-technical-prerequisites)
4. [Sprint Breakdown](#4-sprint-breakdown)
5. [Feature Implementation Details](#5-feature-implementation-details)
6. [Scratchpad — Phase 2 Future Features](#6-scratchpad--phase-2-future-features)
7. [Definition of Done](#7-definition-of-done)

---

## 1. Project Overview

**The Movement** is a Progressive Web App (PWA) that functions as a "Trust Engine" for civic and social movements. It solves three critical problems that organizers face:

| Problem | Solution |
|---|---|
| Misinformation spreads within movements | **Multi-Sig Announcement Feed** — announcements require N-of-M organizer signatures before going public |
| Crowd density is unknown in real-time | **Live Check-in Heatmap** — GPS-based heatmap updates live via Supabase Realtime |
| Volunteer accountability is low | **Bounty Board + Peer Verification** — tasks require community confirmation before credit is given |
| Trust and reputation are invisible | **Impact Ledger / Badge Profile** — a public, tamper-evident record of verified contributions |

---

## 2. Phase Definition

### Phase 1 — MVP (This Document)

Strictly contains the following 4 core features. **No other features are to be developed in Phase 1.**

| # | Feature | Priority |
|---|---|---|
| 1 | Multi-Sig Announcement Feed | P0 |
| 2 | Live Check-in Heatmap | P0 |
| 3 | Bounty Board Task Claim | P0 |
| 4 | Impact Ledger / Badge Profile | P0 |

**Authentication approach for MVP:**
- Supabase Auth with **magic link (passwordless email)** for basic session management. This is the only MVP auth method — do not also add email+password in Phase 1.
- Mock identity upgrade: any uploaded "document" auto-upgrades the user to Tier 3 (Organizer). No real ID verification.

**Explicitly excluded from Phase 1:**
- AI image verification (Gemini, deepfake detection)
- Real government ID verification (Onfido, Persona, etc.)
- Treasury / token management
- Liquid Democracy / delegated voting
- EXIF metadata stripping

### Phase 2 — Future Scope

See [Section 6](#6-scratchpad--phase-2-future-features) for the full scratchpad.

---

## 3. Technical Prerequisites

### Stack (all free-tier compatible)

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | RSC + SSR + API Routes in one project |
| Language | TypeScript (strict) | Type safety across client and server |
| Styling | Tailwind CSS + shadcn/ui | Rapid, accessible component system |
| Backend-as-a-Service | Supabase | PostgreSQL + Realtime + Auth + Storage |
| Map | react-leaflet + leaflet.heat | Open-source, no API key required |
| Data Fetching | TanStack Query v5 (React Query) | Caching, background sync, no useEffect sprawl |
| Validation | Zod | Runtime type safety for forms and API responses |
| PWA | next-pwa | Service Worker registration, offline shell |

### Required Accounts & Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=<your_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>   # Server-side only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Rule:** SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to the client. It is used only in Next.js Route Handlers (app/api/**).

---

## 4. Sprint Breakdown

### Sprint 0 — Project Scaffolding

**Goal:** Working skeleton with auth shell, CI-ready, deployed to Vercel preview.

**Tasks:**

1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```

2. **Install all dependencies at once**
   ```bash
   # Core UI
   npx shadcn@latest init
   npx shadcn@latest add button card badge avatar skeleton dialog toast

   # Data & validation
   npm install @tanstack/react-query zod @hookform/resolvers react-hook-form

   # Supabase
   npm install @supabase/supabase-js @supabase/ssr

   # Maps
   npm install react-leaflet leaflet
   npm install -D @types/leaflet
   npm install leaflet.heat

   # PWA
   npm install next-pwa
   ```

3. **Configure directory structure:**
   ```
   src/
   ├── app/
   │   ├── (auth)/
   │   │   ├── login/page.tsx
   │   │   └── signup/page.tsx
   │   ├── (dashboard)/
   │   │   ├── layout.tsx          <- Sidebar shell
   │   │   ├── feed/page.tsx       <- Multi-Sig Announcements
   │   │   ├── heatmap/page.tsx    <- Live Check-in Map
   │   │   ├── tasks/page.tsx      <- Bounty Board
   │   │   └── profile/[userId]/page.tsx <- Badge Profile
   │   ├── api/
   │   │   ├── check-in/route.ts
   │   │   ├── sign-announcement/route.ts
   │   │   ├── claim-task/route.ts
   │   │   └── verify-task/route.ts
   │   └── layout.tsx
   ├── components/
   │   ├── ui/                     <- shadcn components (auto-generated)
   │   ├── feed/
   │   ├── heatmap/
   │   ├── tasks/
   │   └── profile/
   ├── lib/
   │   ├── supabase/
   │   │   ├── client.ts           <- Browser client
   │   │   └── server.ts           <- Server client (RSC/Route Handlers)
   │   ├── schemas/                <- Zod schemas
   │   └── types/                  <- TypeScript interfaces
   └── hooks/                      <- Custom React hooks
   ```

4. **Set up Supabase client helpers:**
   ```typescript
   // src/lib/supabase/client.ts
   import { createBrowserClient } from '@supabase/ssr'
   export const createClient = () =>
     createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   ```

5. **Configure next.config.js for PWA:**
   ```javascript
   const withPWA = require('next-pwa')({ dest: 'public', disable: process.env.NODE_ENV === 'development' })
   module.exports = withPWA({ /* next config */ })
   ```

6. **Set up TanStack Query provider in app/layout.tsx**

**Done when:** `npm run dev` serves a working Next.js app with Supabase auth session accessible via SSR.

---

### Sprint 1 — Auth, DB & Mock Identity

**Goal:** Users can sign up, log in, upload a fake document, and get upgraded to Tier 3.

**Tasks:**

1. **Apply Supabase migrations** — run all CREATE TABLE statements in Supabase SQL Editor. Enable RLS on all tables.

2. **Build Auth pages** (`/login`, `/signup`) using shadcn Card, Input, Button components.

3. **Mock Identity Upgrade flow:**
   - Build a `/onboarding` page with a file upload field (shadcn `Input type="file"`).
   - On upload: store the file in a Supabase Storage bucket (`documents/`).
   - Call a Route Handler `POST /api/upgrade-tier`:
     ```typescript
     // DEMO MOCK — accepts any file, sets tier = 3
     await supabaseAdmin.from('users').update({ tier: 3 }).eq('id', userId)
     ```
   - Redirect to `/dashboard`.

4. **Zod schema for User:**
   ```typescript
   // src/lib/schemas/user.schema.ts
   export const UserSchema = z.object({
     id: z.string().uuid(),
     display_name: z.string().min(2).max(60),
     tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
     metadata: z.record(z.unknown()).optional(),
   })
   export type User = z.infer<typeof UserSchema>
   ```

5. **Test personas** (seed via Supabase SQL or a seed script):

   | Name | Email | Tier | Role |
   |---|---|---|---|
   | Alex Rivera | alex@demo.test | 3 | Lead Organizer |
   | Jordan Lee | jordan@demo.test | 3 | Co-Organizer |
   | Sam Patel | sam@demo.test | 3 | Co-Organizer |
   | Casey Kim | casey@demo.test | 2 | Senior Volunteer |
   | Morgan Chen | morgan@demo.test | 1 | Volunteer |

**Done when:** All 5 test personas exist in DB, any user can upload a fake doc and become Tier 3.

---

### Sprint 2 — Heatmap & Task Board

**Goal:** GPS check-in pins appear on a live-updating Leaflet heatmap; Task Board shows open tasks with claim flow.

#### 2A — Live Check-in Heatmap

**Implementation details:**

1. **Browser Geolocation API** — use `navigator.geolocation.getCurrentPosition()`. No third-party geolocation library needed.

   ```typescript
   // src/hooks/useGeoLocation.ts
   export function useGeoLocation() {
     const [coords, setCoords] = useState<GeolocationCoordinates | null>(null)
     const [error, setError] = useState<string | null>(null)
     const capture = () => {
       if (!navigator.geolocation) { setError('Geolocation not supported'); return }
       navigator.geolocation.getCurrentPosition(
         (pos) => setCoords(pos.coords),
         (err) => setError(err.message),
         { enableHighAccuracy: true, timeout: 10000 }
       )
     }
     return { coords, error, capture }
   }
   ```

2. **Check-in API Route** (`POST /api/check-in`):
   - Accepts `{ lat, lng, movement_id }` from the client.
   - Validates with Zod: `z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), movement_id: z.string().uuid() })`.
   - Rate limit: max 1 check-in per user per 5 minutes.
   - Inserts into `check_ins` table.

3. **Leaflet + leaflet.heat setup** — map must be rendered **client-side only** (Leaflet requires `window`):
   ```typescript
   // src/components/heatmap/HeatmapView.tsx
   'use client'
   import dynamic from 'next/dynamic'
   const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })
   ```

4. **Real-time subscription pattern:**
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel('check_ins_realtime')
       .on('postgres_changes', {
         event: 'INSERT', schema: 'public', table: 'check_ins',
         filter: `movement_id=eq.${movementId}`
       }, (payload) => {
         const { lat, lng } = payload.new
         setHeatPoints(prev => [...prev, [lat, lng, 0.8]])
       })
       .subscribe()
     return () => { supabase.removeChannel(channel) }
   }, [movementId])
   ```

#### 2B — Bounty Board Task Claim

1. **Task list page** (`/tasks`) — fetches via TanStack Query. Show Skeleton cards while loading.

2. **Claim flow:**
   - `POST /api/claim-task` with `{ task_id }`.
   - Validates user is not already claimant. Inserts into `task_claims` with `status = 'in_progress'`.
   - TanStack Query invalidates `['tasks']` key.

3. **"Mark Complete" flow:**
   - `POST /api/complete-task` with `{ claim_id }`.
   - Updates `task_claims.status = 'pending_verification'`.
   - Inserts 3 random eligible voters into `peer_verifications`.

**Done when:** Check-in button drops GPS pin on heatmap in under 3s; tasks can be claimed and marked complete.

---

### Sprint 3 — Multi-Sig Feed & Peer Review

**Goal:** Full announcement cycle and verification cycle work end-to-end.

#### 3A — Multi-Sig Announcement Feed

1. **Draft creation** (Tier 3 only):
   - `POST /api/announcements` — inserts row with `is_published = false`. Auto-signs with creator's signature.

2. **Signature collection:**
   - `POST /api/sign-announcement` — checks user hasn't already signed; inserts into `announcement_signatures`.
   - **PostgreSQL trigger:** After each insert, counts current sigs vs `required_signatures`. If met, sets `is_published = true`.

3. **Public feed** (`/feed`) — only shows announcements where `is_published = true` (enforced by RLS).

#### 3B — Peer Verification Flow

**Zod schema for `task_claims.status` — must match the DB CHECK constraint exactly:**
```typescript
// src/lib/schemas/task.schema.ts
status: z.enum(['in_progress', 'pending_verification', 'verified', 'rejected', 'withdrawn']),
```

1. When `task_claims.status` changes to `'pending_verification'`, the Route Handler calls `assign_peer_verifiers(claim_id)` which randomly selects 3 eligible voters from the movement's members.
2. Each voter submits `POST /api/verify-task` with `{ verification_id, vote: 'approve' | 'reject' }`.
3. DB function: if `approvals >= 2`, marks claim as `'verified'` and issues a badge.
4. Organizer Override: Tier 3 can bypass peer vote via `POST /api/override-verify`.

**Done when:** Full announcement cycle (draft → sign → publish) and verification cycle (claim → complete → vote → badge) both work in demo.

---

### Sprint 4 — Badge Profile & Polish

**Goal:** Public profile page, PWA manifest, accessibility audit, mobile responsiveness.

1. **Badge Profile page** (`/profile/[userId]`): Server Component. Shows display name, tier, total tasks, badges grid, impact ledger timeline.

2. **Impact Ledger:** Timeline of all verified contributions. Publicly accessible without auth.

3. **PWA manifest** (`public/manifest.json`):
   ```json
   {
     "name": "The Movement",
     "short_name": "Movement",
     "theme_color": "#0f172a",
     "background_color": "#0f172a",
     "display": "standalone",
     "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }]
   }
   ```

4. **Accessibility audit checklist:**
   - All interactive elements have aria-label or visible text label.
   - Map has `role="application"` and keyboard trap escape.
   - Color contrast >= 4.5:1 (WCAG AA).
   - Skeleton loaders use `aria-busy="true"`.
   - All modals trap focus and dismiss on Escape.

**Done when:** Lighthouse PWA score >= 80, Accessibility score >= 90.

---

## 5. Feature Implementation Details

### Geolocation & Heatmap — Full Data Flow

```
User clicks "Check In"
        |
        v
navigator.geolocation.getCurrentPosition()
  |-- Success -> { lat, lng, accuracy }
  |     |
  |     v
  |   POST /api/check-in  (Route Handler)
  |     |
  |     |-- Zod validate { lat, lng, movement_id }
  |     |-- Rate limit check (1 check-in per 5 min per user)
  |     |-- INSERT INTO check_ins (user_id, movement_id, lat, lng)
  |     `-- 201 Created
  |
  `-- Error -> Toast notification with human-readable message

Supabase Realtime (subscribed on map load)
        |
        v
postgres_changes INSERT event fires for new check_ins row
        |
        v
React state: heatPoints = [...prev, [lat, lng, 0.8]]
        |
        v
heatLayer.setLatLngs(heatPoints)  <- Leaflet re-renders heatmap
```

### leaflet.heat — Why This Plugin

- **Zero cost:** MIT licensed, no API key.
- **No canvas WebGL complexity:** Uses HTML5 Canvas 2D — works on all mobile browsers.
- **Lightweight:** ~3KB minified.
- **Alternative considered:** deck.gl HeatmapLayer — rejected due to WebGL requirement and ~500KB bundle size.

### TypeScript Shim for leaflet.heat

```typescript
// src/types/leaflet-heat.d.ts
import * as L from 'leaflet'
declare module 'leaflet' {
  function heatLayer(latlngs: [number, number, number?][], options?: {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }): Layer
}
```

---

## 6. Scratchpad — Phase 2 Future Features

> These features are **explicitly out of scope for Phase 1**. They are documented here to inform database schema design decisions (hence the JSONB columns).

### +20% Bounty Overbooking Logic
Allow up to 120% of needed volunteers to claim a task. System auto-selects based on reliability score if all slots fill. DB hook: `tasks.metadata->>'overbooking_factor'` stores the ratio.

### Reliability Scores
A rolling score (0–100) computed from: task completion rate, peer verification vote quality, check-in frequency. Stored in `users.metadata->>'reliability_score'`. Influences overbooking resolution and peer-verifier selection.

### Treasury Shadow Ledger
Track movement funds with double-entry accounting. Tables: `treasury_accounts`, `treasury_transactions`. Uses JSONB for flexible transaction metadata (tags, receipts, chain tx hash).

### Liquid Democracy
Volunteers delegate their verification vote to a trusted peer. Delegation graph stored in `user_delegations`. Cycle detection required before a delegation is accepted.

### EXIF Stripping
When users upload task proof images, strip all EXIF metadata (GPS coords, device info) server-side before storing. Library: `sharp` (Node.js). Protects volunteer privacy and location security.

---

## 7. Definition of Done

A feature is "done" when it meets **all** of the following criteria:

| Criterion | Requirement |
|---|---|
| Type Safety | Zero TypeScript errors (`tsc --noEmit` passes) |
| Validation | All API inputs validated with Zod |
| Loading States | Every async operation shows a Skeleton loader |
| Error Handling | All errors caught by Error Boundary or try/catch with user-facing toast |
| RLS | Row Level Security policy written and tested for the relevant table |
| Mobile | Layout tested at 375px (iPhone SE) width |
| Accessibility | At minimum: aria-label on all icon buttons, focus ring visible |
