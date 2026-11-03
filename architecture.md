# Architecture — The Movement: System Design

> **Version:** 1.0 — MVP Scope  
> **Last Updated:** 2026-11-01  
> **Audience:** Full-stack engineers, reviewers

---

## Table of Contents

1. [Strict Boundary Model](#1-strict-boundary-model)
2. [Real-Time Data Flow — Heatmap](#2-real-time-data-flow--heatmap)
3. [Peer Verification Logic Flow](#3-peer-verification-logic-flow)
4. [Multi-Sig Announcement Flow](#4-multi-sig-announcement-flow)
5. [Security Architecture](#5-security-architecture)
6. [Deployment Topology](#6-deployment-topology)
7. [Key Architectural Decisions (ADRs)](#7-key-architectural-decisions-adrs)

---

## 1. Strict Boundary Model

The application enforces a **4-layer strict boundary model**. Each layer has precisely defined responsibilities and is prohibited from doing the work of another layer.

```
+------------------+
|   CLIENT LAYER   |  Browser / PWA
|                  |  - React components, Leaflet map
|                  |  - TanStack Query (cache, UI state)
|                  |  - NO direct DB access
|                  |  - NO service role key
+--------+---------+
         | HTTPS
+--------+---------+
|   EDGE LAYER     |  Vercel Edge Network / Next.js Middleware
|                  |  - Auth cookie validation (Supabase SSR)
|                  |  - Route protection (redirect unauth users)
|                  |  - NO business logic
|                  |  - NO DB queries
+--------+---------+
         | Internal
+--------+---------+
|   CORE LAYER     |  Next.js App Router (Server)
|                  |  - React Server Components (RSC)
|                  |  - Route Handlers (API endpoints)
|                  |  - Zod input validation
|                  |  - Business logic (tier checks, rate limiting)
|                  |  - Uses SUPABASE_SERVICE_ROLE_KEY (server only)
+--------+---------+
         | Postgres wire protocol / REST
+--------+---------+
|   DB LAYER       |  Supabase (PostgreSQL 15)
|                  |  - Row Level Security (last line of defense)
|                  |  - SECURITY DEFINER functions & triggers
|                  |  - Realtime WebSocket channels
|                  |  - Storage (document uploads)
+------------------+
```

### Layer Rules (Non-negotiable)

| Rule | Violation Example | Consequence |
|---|---|---|
| Client never uses service role key | `SUPABASE_SERVICE_ROLE_KEY` in a client component | Bypasses all RLS — critical security breach |
| Edge only handles auth/routing | Business logic in middleware | Cannot be unit tested, hard to maintain |
| Core validates ALL inputs | Trusting client-sent `tier` field | Privilege escalation attack vector |
| DB has RLS as last line of defense | Relying solely on API-layer checks | Direct Supabase client attacks bypass API |

### Client → Core Communication

All mutations from the browser go through **Route Handlers** (`app/api/**`), never directly to Supabase via the anon key for write operations. The anon key is only used for:
- Reading published announcements
- Reading heatmap check-ins (via Realtime subscription — read-only)
- Reading public badge profiles

---

## 2. Real-Time Data Flow — Heatmap

This is the most architecturally interesting part of the system. Understanding this flow is critical.

### Full Flow: From GPS Tap to Heatmap Blob

```
[BROWSER]                    [CORE LAYER]                 [DB LAYER]
    |                             |                            |
    | User taps "Check In"        |                            |
    |                             |                            |
    | navigator.geolocation       |                            |
    | .getCurrentPosition()       |                            |
    |   -> { lat, lng }           |                            |
    |                             |                            |
    | POST /api/check-in          |                            |
    | { lat, lng, movement_id }   |                            |
    |                        ----> Zod validate               |
    |                             | Rate limit check           |
    |                             | (last check-in < 5min ago?)|
    |                             |                            |
    |                             | INSERT check_ins      ---->|
    |                             |                            | Row inserted
    |                             |                            |
    |  <---- 201 Created          |                            |
    |                             |                            |
    |                        ~~~~ Supabase Realtime ~~~~       |
    |                             |                            | postgres_changes
    |  <~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  event fires
    |  { lat, lng, user_id, ... } |                            |
    |                             |                            |
    | setHeatPoints(prev =>        |                            |
    |   [...prev, [lat, lng, 0.8]])|                           |
    |                             |                            |
    | heatLayer.setLatLngs(       |                            |
    |   heatPoints)               |                            |
    |                             |                            |
    | [Heatmap blob expands]      |                            |
```

### Key Design Choices Explained

**Why does the API response (201) come BEFORE the Realtime event appears?**

The API route inserts the row and returns immediately. Supabase Realtime's `postgres_changes` events are fired by PostgreSQL's WAL (Write-Ahead Log) replication stream — this is asynchronous. The client therefore receives the `201 Created` from its OWN request, and also receives the Realtime event (which it de-dupes or ignores for its own pin, showing instead an **optimistic update**).

**Optimistic Update Strategy:**
```typescript
// When the user checks in, immediately show their pin without waiting for Realtime
const { capture } = useGeoLocation()
const checkInMutation = useMutation({
  mutationFn: async (coords: GeolocationCoordinates) => {
    // 1. Optimistically add to heatmap immediately
    setHeatPoints(prev => [...prev, [coords.latitude, coords.longitude, 1.0]])
    // 2. Fire API request
    return fetch('/api/check-in', { ... })
  },
  onError: (_, coords) => {
    // Rollback the optimistic update if API call fails
    setHeatPoints(prev => prev.filter(p => !(p[0] === coords.latitude && p[1] === coords.longitude)))
    toast({ title: 'Check-in failed', variant: 'destructive' })
  }
})
```

**Why Supabase Realtime instead of polling?**

| Approach | Latency | Server Load | Complexity |
|---|---|---|---|
| Polling every 5s | 0-5s | High (N users × 1 req/5s) | Low |
| Long polling | 0-30s | Medium | Medium |
| Supabase Realtime (WebSocket) | <500ms | Low (1 persistent connection per client) | Low |

Supabase Realtime uses PostgreSQL Logical Replication under the hood. The DB pushes changes; clients don't poll. For a heatmap with potentially thousands of concurrent check-ins, this is the only scalable approach.

**Heatmap initialization (on page load):**

When the heatmap page first loads, we need to show the last N check-ins (the "warm state"). This is a standard TanStack Query fetch — we load the last 500 check-ins for the movement from the DB on mount. The Realtime subscription then adds new points on top.

```typescript
// On mount: load recent check-ins
const { data: initialPoints } = useQuery({
  queryKey: QueryKeys.checkIns(movementId),
  queryFn: async () => {
    const { data } = await supabase
      .from('check_ins')
      .select('lat, lng')
      .eq('movement_id', movementId)
      .order('checked_in_at', { ascending: false })
      .limit(500)
    return data?.map(c => [c.lat, c.lng, 0.6] as [number, number, number]) ?? []
  }
})

// Merge initial + realtime points
const allPoints = useMemo(() => [
  ...(initialPoints ?? []),
  ...realtimePoints
], [initialPoints, realtimePoints])
```

---

## 3. Peer Verification Logic Flow

### State Machine for Task Claims

```
          [open]
             |
             | Volunteer clicks "Claim"
             | POST /api/claim-task
             v
        [in_progress] (task_claims.status = 'in_progress')
             |
             | Claimant clicks "Mark Complete"
             | POST /api/complete-task
             v
   [pending_verification] <-- 3 peer verifiers assigned
             |                  (assign_peer_verifiers() called)
             |
     +--------+--------+
     |                 |
     | 2/3 approve     | 3/3 reject OR timeout (48h)
     v                 v
  [verified]        [rejected]
  Badge issued      Claim closed,
                    task reopens
```

### Full Peer Verification Data Flow

```
[CLAIMANT BROWSER]           [CORE LAYER]              [DB LAYER]
       |                          |                         |
       | "Mark Complete"          |                         |
       | POST /api/complete-task  |                         |
       | { claim_id }             |                         |
       |                     ----> Auth check: is user       |
       |                          | the actual claimant?    |
       |                          |                         |
       |                          | UPDATE task_claims  --->|
       |                          | SET status =           |
       |                          | 'pending_verification' |
       |                          |                         |
       |                          | SELECT assign_peer_      |
       |                          | verifiers(claim_id) --->|
       |                          |                         | Selects 3 random users
       |                          |                         | Inserts 3 rows into
       |  <--- 200 OK             |                         | peer_verifications
       |                          |                         |
       |                          |                         |
[VERIFIER A BROWSER]         [CORE LAYER]              [DB LAYER]
       |                          |                         |
       | User sees "Tasks to      |                         |
       | Verify" notification     |                         |
       | (via Realtime or polling)|                         |
       |                          |                         |
       | Clicks "Approve"         |                         |
       | POST /api/verify-task    |                         |
       | { verification_id,       |                         |
       |   vote: 'approve' }      |                         |
       |                     ----> Auth: is user the        |
       |                          | assigned verifier?      |
       |                          |                         |
       |                          | UPDATE peer_        --->|
       |                          | verifications           | vote = 'approve'
       |                          | SET vote = 'approve'   |
       |                          |                         | TRIGGER fires:
       |                          |                         | check_peer_verification_threshold()
       |                          |                         |
       |                          |                         | Count approvals: 1
       |                          |                         | (Not yet 2 -- nothing happens)
       |                          |                         |
  [After Verifier B also approves]                          |
       |                          |                         | Count approvals: 2
       |                          |                         | UPDATE task_claims
       |                          |                         | SET status = 'verified'
       |                          |                         |
       |                          |                         | INSERT INTO badges
       |                          |                         | (user=claimant, issued_by='peer_vote')
       |                          |                         |
[CLAIMANT BROWSER]                                          |
       | Realtime: badges INSERT  |                         |
       | -> toast "Badge Earned!" |                         |
       | -> Badge appears on      |                         |
       |    profile page          |                         |
```

### Organizer Override Path

```typescript
// POST /api/override-verify
// Only callable by Tier 3 users

export async function POST(req: Request) {
  // 1. Verify caller is Tier 3
  // 2. Get claim details
  // 3. UPDATE task_claims SET status = 'verified', verified_at = now()
  // 4. INSERT INTO badges (issued_by = 'organizer_override', issued_by_user = organizer_id)
  // 5. Return 200
}
```

---

## 4. Multi-Sig Announcement Flow

### Architecture Diagram

```
[ORGANIZER A]                [CORE LAYER]              [DB LAYER]
      |                           |                         |
      | "Draft Announcement"      |                         |
      | POST /api/announcements   |                         |
      | { title, body,            |                         |
      |   required_signatures: 2} |                         |
      |                      ----> Tier 3 check             |
      |                           |                         |
      |                           | INSERT announcements -->|
      |                           | is_published = false    |
      |                           |                         |
      |                           | INSERT announcement_--->|
      |                           | signatures              |
      |                           | (auto-sign as creator)  | Trigger fires:
      |                           |                         | count = 1, need 2
      |                           |                         | (no publish yet)
      |  <--- 201 Created         |                         |
      |                           |                         |
[ORGANIZER B sees pending in feed]                          |
      |                           |                         |
      | "Sign" button             |                         |
      | POST /api/sign-announcement                         |
      | { announcement_id }       |                         |
      |                      ----> Tier 3 check             |
      |                           | Already signed? (NO)   |
      |                           |                         |
      |                           | INSERT announcement_--->|
      |                           | signatures              | Trigger fires:
      |                           |                         | count = 2, need 2
      |                           |                         | UPDATE announcements
      |                           |                         | SET is_published = true
      |                           |                         |
      |  <--- 200 OK              |                         |
      |                           |                         |
[ALL MOVEMENT MEMBERS]            |                         |
      | Realtime: announcements   |                         |
      | UPDATE event fires        |                         |
      | (is_published = true)     |                         |
      | -> Announcement moves to  |                         |
      |    Published feed section |                         |
```

### Why Triggers Instead of Application Code

The multi-sig threshold check is implemented as a **PostgreSQL trigger** rather than application code because:

1. **Atomicity:** The threshold check and the `is_published` update happen in the same transaction as the signature insert. There's no window where 2 signatures exist but `is_published` is still `false`.
2. **Race condition safety:** If two organizers click "Sign" simultaneously, the database's row-level locking guarantees exactly one of them "completes" the threshold — not zero, not two.
3. **No double-publish:** The `IF v_is_published THEN RETURN` guard prevents the trigger from updating an already-published announcement.

---

## 5. Security Architecture

### Defense in Depth

The system applies security controls at every layer:

```
Layer 1: Client
  - No secrets (service role key never shipped to browser)
  - Zod validation on all form inputs before submission

Layer 2: Edge (Next.js Middleware)
  - Supabase session cookie inspected
  - Unauthenticated users redirected to /login
  - No DB access at this layer

Layer 3: Core (Route Handlers)
  - Auth.uid() verified on every request
  - Tier level checked for privileged operations
  - Zod validation on all request bodies
  - Rate limiting (check-ins: 1 per 5 min per user)
  - SUPABASE_SERVICE_ROLE_KEY only used here, server-side

Layer 4: Database (RLS)
  - Row Level Security on every table
  - Trigger functions use SECURITY DEFINER (not caller context)
  - UNIQUE constraints prevent double-signing, double-claiming
  - CHECK constraints on all enumerable columns
```

### Threat Model — Top Risks & Mitigations

| Threat | Mitigation |
|---|---|
| User claims Tier 3 in request body | API reads tier from DB (`auth.uid()`), never trusts client claims |
| User signs an announcement twice | `UNIQUE(announcement_id, signed_by)` constraint rejects duplicate |
| User votes on peer verification multiple times | `UNIQUE(claim_id, verifier_id)` + `WHERE vote IS NULL` policy |
| User checks in 1000 times rapidly (DDoS heatmap) | Rate limit: check last `check_ins` row timestamp for user |
| Unauthorized user reads pending announcements | RLS policy: pending announcements only visible to Tier 3 members |
| Direct Supabase client bypasses API | RLS is always ON — direct client with anon key is still constrained |

---

## 6. Deployment Topology

```
+------------------+        +------------------+
|   Vercel         |        |   Supabase       |
|   (Free Hobby)   |        |   (Free Tier)    |
|                  |        |                  |
|  Next.js App     |  HTTPS |  PostgreSQL 15   |
|  - SSR/RSC       +------->+  Realtime WS     |
|  - Route Handlers|        |  Auth            |
|  - Edge Middleware|       |  Storage         |
|  - next-pwa SW   |        |                  |
+------------------+        +------------------+
         |                           |
         | CDN                       | Realtime WebSocket
         v                           v
+------------------+        +------------------+
|   Browser / PWA  |        |   Browser / PWA  |
|   (Service Worker|        |   (Realtime      |
|    caches shell) |        |    subscription) |
+------------------+        +------------------+
```

### Vercel Free Tier Limits (as of 2026)
- 100GB bandwidth / month
- Serverless function duration: 10s max
- Edge function duration: 25ms max (we only use Edge for auth checks)

### Supabase Free Tier Limits (as of 2026)
- 500MB database storage
- 1GB file storage
- 50,000 MAU
- **200** concurrent Realtime connections (sufficient for demo/hackathon — the free tier was previously mistakenly listed as 2)

> **Hackathon Note:** Both free tiers are more than sufficient for demo traffic. The architecture is designed to scale — when paid tiers are needed, no code changes are required, only account upgrades.

---

## 7. Key Architectural Decisions (ADRs)

### ADR-001: PostgreSQL Triggers for Multi-Sig Logic

**Decision:** Implement threshold checks as `AFTER INSERT` triggers on `announcement_signatures`.

**Alternatives considered:**
- Application code in Route Handler: rejected due to race condition risk under concurrent requests.
- Scheduled cron job: rejected due to latency (announcements should publish instantly on threshold).

**Consequences:** Requires engineers to understand PostgreSQL trigger semantics. All trigger functions must be versioned in migration files.

---

### ADR-002: Supabase Realtime for Heatmap vs. Polling

**Decision:** Use Supabase `postgres_changes` Realtime subscription for live heatmap updates.

**Alternatives considered:**
- Client polling every 3s: Creates N*1 server load per active user. At 1000 concurrent users = 333 requests/second just for heatmap.
- Server-Sent Events (SSE): Would require a persistent Vercel serverless connection — incompatible with serverless architecture.

**Consequences:** Client maintains one WebSocket connection per Supabase Realtime subscription. Supabase Free tier allows **200** concurrent Realtime connections (suitable for hackathon demo; see deployment section).

---

### ADR-003: leaflet.heat over deck.gl

**Decision:** Use `leaflet.heat` for heatmap rendering.

**Alternatives considered:**
- `deck.gl` HeatmapLayer: Requires WebGL, adds ~500KB to bundle, more complex setup.
- Google Maps Heatmap: Requires API key, billing account.
- Mapbox: Requires API key, usage caps on free tier.

**Consequences:** `leaflet.heat` uses Canvas 2D, which works on all mobile browsers. Visual quality is lower than WebGL alternatives, but sufficient for civic tech demonstration.

---

### ADR-004: No Global State Library

**Decision:** Use TanStack Query + `useState` only. No Redux or Zustand.

**Rationale:** The app has no truly global client-side state that isn't:
- Server data (handled by TanStack Query)
- URL state (handled by Next.js router)
- Local UI state (handled by `useState`)

Adding Zustand or Redux for MVP adds cognitive overhead without benefit. This can be revisited in Phase 2 if complex cross-component state emerges.

---

### ADR-005: App Router over Pages Router

**Decision:** Use Next.js App Router (RSC) over Pages Router.

**Rationale:**
- Badge Profile pages are public and SEO-critical → RSC renders them with zero JS hydration overhead.
- Nested layouts (sidebar stays mounted while page content changes) are a first-class feature of App Router.
- `loading.tsx` and `error.tsx` colocation is cleaner than HOC patterns in Pages Router.

**Consequences:** Engineers must understand RSC vs. Client Component boundaries. The `'use client'` directive is required for any component using hooks, browser APIs (Leaflet), or event handlers.

---

### ADR-006: Multi-Tiered Fail-Safe Data Adapter Pattern

**Decision:** Wrap all live REST operations in `FallbackApiAdapter` with transparent, silent fallback to in-memory `MockApiAdapter` upon database error or rate limiting.

**Rationale:** In civic coordination tools and hackathon demonstrations, external cloud database rate limits or sleep cycles must never cause client-side uncaught exceptions, blank screens, or broken user experiences.

**Consequences:** The UI maintains continuous 100% functionality regardless of network conditions or backend compute limits.

---

### ADR-007: Append-Only Cryptographic Audit Ledger (`ground_truth_commits`)

**Decision:** Record all verified task completions, multi-sig announcements, and milestone verifications in an immutable table linked via parent SHA-256 hashes.

**Rationale:** Civic actions require public verifiability. Anyone can independently verify that a specific contribution or announcement was cryptographically authorized without tampering.

---

### ADR-008: Automated Quorum & Milestone Badge Resolution Triggers

**Decision:** Enforce 3 assigned peer verifiers and $\ge 2$ approval threshold via database trigger `check_peer_verification_quorum()` on `peer_verifications`.

**Rationale:** Delegating consensus counting and impact point minting to PostgreSQL database triggers guarantees atomicity and eliminates distributed race conditions or duplicate awards.

---

### ADR-009: 5-Character Unambiguous Join Codes

**Decision:** Generate 5-character movement invite codes (`2-9`, `A-Z` excluding `0`, `O`, `1`, `I`) paired with direct URL routing (`/join/[code]`).

**Rationale:** Volunteers in the field often receive codes via SMS, verbal relay, or handwritten signs. Eliminating ambiguous characters prevents join failures and speeds up mobile recruitment.
