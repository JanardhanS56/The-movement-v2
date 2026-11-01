# The Movement — Backend API Integration Guide

This document provides complete instructions, endpoint specifications, JSON request/response payloads, and TypeScript types for frontend developers to replace the client-side `MockApiAdapter` with live backend API routes.

---

## 1. Environment & Architecture Overview

All backend operations are served via Next.js App Router Route Handlers under `/api/*`. Database mutations and multi-table transactions (threshold counting, peer verifier assignment, badge issuance) execute securely server-side using the `SUPABASE_SERVICE_ROLE_KEY`.

### Standardized Error Contract
Every failed request returns HTTP 4xx or 5xx with this structure:
```json
{
  "success": false,
  "error": "Human-readable explanation of why the action failed"
}
```

### Standardized Success Contract
Every successful request returns HTTP 200 or 201 with this structure:
```json
{
  "success": true,
  "data": { ... }
}
```

### Client Authentication
Pass the authenticated user's ID via either:
1. `x-user-id: <USER_UUID>` header (simplest for demo personas).
2. `Authorization: Bearer <SUPABASE_JWT>` header.

---

## 2. Seeded Personas & Movement ID

Default Movement ID: `00000000-0000-4000-8000-000000000001` (Coastal Action Front)

| Persona | Role | Tier | Email | Password | User ID |
|---|---|---|---|---|---|
| **Priya** | Organizer | 3 | `organizer@demo.com` | `password123` | `14e91ea8-02db-4063-b3e9-3161348d2141` |
| **Alex** | Senior Volunteer | 2 | `volunteer1@demo.com` | `password123` | `86a641ba-ca37-4597-be7e-d6c904f46363` |
| **Sam** | Senior Volunteer | 2 | `volunteer2@demo.com` | `password123` | `df7e163a-610c-4451-b5c9-d703b45ca11b` |
| **Jordan** | Volunteer / Bystander | 1 | `user@demo.com` | `password123` | `346dbaf9-0d06-4931-989e-75e0047a3baa` |

---

## 3. API Endpoint Specifications

### A. Multi-Sig Announcements

#### 1. `POST /api/announcements`
Drafts a new announcement. Only Tier 3 Organizers are authorized. The author's signature is automatically recorded as signature #1. If `required_signatures = 1`, it immediately publishes to `status: "live"`.

- **Headers:** `Content-Type: application/json`, `x-user-id: <ORGANIZER_UUID>`
- **Request Body:**
```json
{
  "movement_id": "00000000-0000-4000-8000-000000000001",
  "title": "Town Hall Evacuation Notice",
  "body": "Relocating central triage unit to High School gym due to road flooding.",
  "required_signatures": 2
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "e305e94b-4b10-4fa8-bb28-2615c4d3b6f0",
    "movement_id": "00000000-0000-4000-8000-000000000001",
    "created_by": "14e91ea8-02db-4063-b3e9-3161348d2141",
    "title": "Town Hall Evacuation Notice",
    "body": "Relocating central triage unit to High School gym due to road flooding.",
    "required_signatures": 2,
    "is_published": false,
    "published_at": null,
    "metadata": { "status": "pending" },
    "created_at": "2026-11-01T12:00:00.000Z"
  }
}
```

#### 2. `POST /api/announcements/[id]/sign`
Co-signs a pending announcement. Only Tier 3 Organizers are authorized. Duplicate signatures return 409 Conflict. When signatures reach `required_signatures`, status automatically flips to `"live"` (`is_published: true`).

- **Headers:** `x-user-id: <CO_ORGANIZER_UUID>`
- **Request Body:** `{}` (or `{ "signerId": "<CO_ORGANIZER_UUID>" }`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "signature": {
      "id": "9426f322-c359-42b7-87bb-788b1cb35560",
      "announcement_id": "e305e94b-4b10-4fa8-bb28-2615c4d3b6f0",
      "signed_by": "14e91ea8-02db-4063-b3e9-3161348d2141",
      "signed_at": "2026-11-01T12:05:00.000Z"
    },
    "signed_count": 2,
    "required_signatures": 2,
    "is_published": true,
    "status": "live"
  }
}
```

#### 3. `GET /api/announcements`
Fetches announcements for a movement. Organizers (Tier 3) receive both pending and live announcements; other tiers receive only live announcements (`is_published = true`).

- **Query Params:** `movementId=<UUID>` (optional), `userId=<UUID>` (optional)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e305e94b-4b10-4fa8-bb28-2615c4d3b6f0",
      "movement_id": "00000000-0000-4000-8000-000000000001",
      "created_by": "14e91ea8-02db-4063-b3e9-3161348d2141",
      "title": "Town Hall Evacuation Notice",
      "body": "Relocating central triage unit to High School gym.",
      "required_signatures": 2,
      "is_published": true,
      "published_at": "2026-11-01T12:05:00.000Z",
      "signatures": [
        { "id": "...", "signed_by": "14e91ea8-...", "signed_at": "..." }
      ]
    }
  ]
}
```

---

### B. Bounty Board & Tasks

#### 1. `GET /api/tasks`
Lists all tasks for the movement.
- **Query Params:** `movementId=<UUID>` (optional), `status=open|in_progress|pending_verification|completed` (optional)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "10000000-0000-4000-8000-000000000001",
      "movement_id": "00000000-0000-4000-8000-000000000001",
      "title": "Distribute emergency flood relief packs",
      "description": "Deliver 50 standardized food and sanitation kits.",
      "reward_points": 150,
      "required_volunteers": 3,
      "status": "open",
      "claims": []
    }
  ]
}
```

#### 2. `POST /api/tasks/[id]/claim`
Claims an open task for the volunteer.
- **Headers:** `x-user-id: <VOLUNTEER_UUID>`
- **Request Body:** `{ "note": "I have a truck available for distribution" }`
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "786a3d12-...",
    "task_id": "10000000-0000-4000-8000-000000000001",
    "claimed_by": "86a641ba-ca37-4597-be7e-d6c904f46363",
    "status": "in_progress",
    "claimed_at": "2026-11-01T12:10:00.000Z"
  }
}
```

#### 3. `POST /api/tasks/[id]/complete`
Marks a claimed task complete and triggers peer verifier assignment. Automatically selects 3 random movement peers (excluding the claimant and task creator).
- **Headers:** `x-user-id: <VOLUNTEER_UUID>`
- **Request Body:**
```json
{
  "note": "Delivered 50 boxes to sector 4 relief center",
  "proof_url": "https://example.com/receipt.jpg"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "claim": {
      "id": "786a3d12-...",
      "status": "pending_verification",
      "completed_at": "2026-11-01T12:15:00.000Z"
    },
    "verifications_assigned": 3,
    "assigned_verifiers": [
      "86a641ba-ca37-4597-be7e-d6c904f46363",
      "df7e163a-610c-4451-b5c9-d703b45ca11b",
      "14e91ea8-02db-4063-b3e9-3161348d2141"
    ]
  }
}
```

---

### C. Peer Verification & Organizer Override

#### 1. `GET /api/verifications/pending`
Returns claims awaiting the current verifier's review.
- **Query Params:** `verifierId=<UUID>` (or `x-user-id` header)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "verif-uuid-1",
      "claim_id": "786a3d12-...",
      "verifier_id": "df7e163a-610c-4451-b5c9-d703b45ca11b",
      "vote": null,
      "assigned_at": "2026-11-01T12:15:00.000Z",
      "expires_at": "2026-11-03T12:15:00.000Z"
    }
  ]
}
```

#### 2. `POST /api/verifications/[id]/vote`
Submits a peer vote (`"approve"` or `"reject"`).
- Consensus rules:
  - If `approvals >= 2`: Claim status changes to `"verified"`, task changes to `"completed"`, and a badge is automatically awarded to the claimant.
  - If `rejections >= 2`: Claim status changes to `"rejected"`.
- **Headers:** `x-user-id: <VERIFIER_UUID>`
- **Request Body:**
```json
{
  "vote": "approve"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "claim_id": "786a3d12-...",
    "claim_status": "verified",
    "approvals": 2,
    "rejections": 0,
    "verified": true
  }
}
```

#### 3. `POST /api/tasks/[id]/organizer-verify`
Organizer bypass/override. Authorized for Tier 3 Organizers only.
- **Headers:** `x-user-id: <ORGANIZER_UUID>`
- **Request Body:**
```json
{
  "approve": true,
  "note": "Confirmed directly with field supervisor"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "claim_id": "786a3d12-...",
    "status": "verified",
    "approved": true,
    "issued_by": "organizer_override",
    "issued_by_user": "14e91ea8-02db-4063-b3e9-3161348d2141"
  }
}
```

---

### D. Live Heatmap & Privacy-Preserving Check-in

#### 1. `POST /api/checkins`
Submits GPS coordinates. Automatically truncates latitude and longitude to 3 decimal places (~110m accuracy) to guarantee volunteer physical privacy.
- **Headers:** `x-user-id: <USER_UUID>` (optional; falls back to demo volunteer if unauthenticated)
- **Request Body:**
```json
{
  "movement_id": "00000000-0000-4000-8000-000000000001",
  "lat": 12.872456,
  "lng": 74.846123,
  "accuracy": 15
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "check_in": {
      "id": "...",
      "movement_id": "00000000-0000-4000-8000-000000000001",
      "user_id": "86a641ba-ca37-4597-be7e-d6c904f46363",
      "lat": 12.872,
      "lng": 74.846,
      "accuracy": 15,
      "checked_in_at": "2026-11-01T12:20:00.000Z"
    },
    "point": [12.872, 74.846, 0.8],
    "truncated": true
  }
}
```

#### 2. `GET /api/checkins`
Returns aggregated cluster telemetry for Leaflet Heat (`[lat, lng, intensity]`).
- **Query Params:** `movementId=<UUID>` (optional), `raw=true` (returns bare array `Array<[lat, lng, intensity]>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "heatmap_tuples": [
      [12.872, 74.846, 0.95],
      [12.875, 74.850, 0.70]
    ],
    "points": [
      { "lat": 12.872, "lng": 74.846, "intensity": 0.95 },
      { "lat": 12.875, "lng": 74.850, "intensity": 0.70 }
    ],
    "total_check_ins": 42,
    "active_clusters": 5
  }
}
```

---

### E. Impact Ledger & Badges

#### 1. `GET /api/badges/[userId]`
Returns all badges earned by a user.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "badge-uuid-1",
      "user_id": "86a641ba-ca37-4597-be7e-d6c904f46363",
      "badge_type": "task_complete",
      "badge_label": "Distribute emergency flood relief packs",
      "issued_by": "peer_vote",
      "metadata": { "task_title": "...", "reward_points": 150 },
      "awarded_at": "2026-11-01T12:18:00.000Z"
    }
  ]
}
```

#### 2. `GET /api/impact?userId=[userId]`
Returns user's complete public impact ledger, stats, and verified contributions.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "86a641ba-ca37-4597-be7e-d6c904f46363",
      "display_name": "Alex",
      "tier": 2
    },
    "stats": {
      "tasks_completed": 3,
      "badges_earned": 3,
      "check_ins_count": 8,
      "total_impact_points": 450
    },
    "badges": [ ... ],
    "ledger": [
      {
        "id": "claim-uuid-1",
        "user_id": "86a641ba-ca37-4597-be7e-d6c904f46363",
        "task_id": "10000000-0000-4000-8000-000000000001",
        "task_title": "Distribute emergency flood relief packs",
        "verification_method": "peer_vote",
        "verified_by_detail": "Peer Review Consensus (2/3)",
        "reward_points": 150,
        "verified_at": "2026-11-01T12:18:00.000Z"
      }
    ]
  }
}
```

---

## 4. How Frontend Wires To Live APIs

In `src/lib/api/index.ts`:
```typescript
import { ApiClient } from "./types"
import { MockApiAdapter } from "./mock-adapter"
import { RestApiAdapter } from "./rest-adapter" // Implements ApiClient calling /api/*

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== "false"

export const api: ApiClient = useMocks ? new MockApiAdapter() : new RestApiAdapter()
```

Set in `.env.local`:
```bash
NEXT_PUBLIC_USE_MOCKS=false
```
All UI components immediately render real database state from Supabase without any UI modifications.
