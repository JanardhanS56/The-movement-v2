# The Movement - Frontend/Backend API Contract Specification

> **Backend Implementation Status:** All routes below are labeled **"Proposed, backend teammate to implement."**  
> In the frontend prototype, all requests are routed through `src/lib/api/index.ts` backed by `MockApiAdapter`. When backend teammates deploy Supabase, the `SupabaseStubAdapter` will be replaced with real Supabase RPC and PostgREST client calls.
>
> **Important Privacy Notice:** **Profile visibility** (whether public or movement-scoped) and **check-in precision / coordinate truncation** (e.g., 3-decimal rounding to ~110m, geohash aggregation, or spatial grid quantization) are **backend privacy decisions** enforced by Postgres RLS, database triggers, and PostGIS views.

---

## 1. Authentication & Role Model Architecture

Every request in production will carry a Supabase JWT in the `Authorization: Bearer <JWT>` header. The JWT payload or `auth.users` metadata identifies the volunteer's ID and verified tier level:
- **Tier 1 (Volunteer):** View announcements, claim open tasks, submit self-check-ins, view public profiles.
- **Tier 2 (Senior Volunteer):** All Tier 1 privileges, plus cast peer verification consensus votes.
- **Tier 3 (Organizer):** All Tier 2 privileges, plus draft announcements (requiring multi-sig approval), post tasks, and execute organizer verification overrides.

---

## 2. API Endpoints Contract

### Announcements & Multi-Signature System

#### `getAnnouncements(movementId: string)`
- **Signature:** `getAnnouncements(movementId: string): Promise<Announcement[]>`
- **Proposed Route & Method:** `GET /rest/v1/announcements?movement_id=eq.{movementId}&select=*&order=created_at.desc`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** `movementId: uuid`
- **Response Schema:** `z.array(AnnouncementSchema)`
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid session JWT.
  - `400 Bad Request`: Malformed UUID.
- **Intended RLS Rules:**
  - Published announcements: `SELECT` allowed for any authenticated user in the movement.
  - Draft / Pending announcements: `SELECT` allowed only if `auth.uid() = created_by OR get_user_tier(auth.uid()) = 3`.
- **Query Keys to Invalidate:** `QueryKeys.announcements(movementId)`

#### `createAnnouncement(input: CreateAnnouncementInput, authorId: string)`
- **Signature:** `createAnnouncement(input: CreateAnnouncementInput, authorId: string): Promise<Announcement>`
- **Proposed Route & Method:** `POST /rest/v1/announcements`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Tier 3 Organizer only (`get_user_tier(auth.uid()) = 3`).
- **Request Schema:** `CreateAnnouncementSchema`
- **Response Schema:** `AnnouncementSchema`
- **Error Responses:**
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: User tier is less than 3.
  - `422 Unprocessable Entity`: Title not between 5-120 chars, body empty, or required_signatures < 1.
- **Intended RLS Rules:**
  - `INSERT WITH CHECK (get_user_tier(auth.uid()) = 3 AND created_by = auth.uid())`
  - Database trigger: Automatically records author as signature 1 in `announcement_signatures`.
- **Query Keys to Invalidate:** `QueryKeys.announcements(input.movement_id)`

#### `getSignatures(announcementId: string)`
- **Signature:** `getSignatures(announcementId: string): Promise<AnnouncementSignature[]>`
- **Proposed Route & Method:** `GET /rest/v1/announcement_signatures?announcement_id=eq.{announcementId}&select=*`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** `announcementId: uuid`
- **Response Schema:** `z.array(AnnouncementSignatureSchema)`
- **Error Responses:** `401 Unauthorized`, `404 Not Found`.
- **Intended RLS Rules:** `SELECT` allowed if user can read the parent announcement.
- **Query Keys to Invalidate:** `QueryKeys.signatures(announcementId)`

#### `signAnnouncement(announcementId: string, signerId: string)`
- **Signature:** `signAnnouncement(announcementId: string, signerId: string): Promise<AnnouncementSignature>`
- **Proposed Route & Method:** `POST /rest/v1/rpc/sign_announcement`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Tier 3 Organizer only.
- **Request Schema:** `{ announcement_id: uuid, signer_id: uuid }`
- **Response Schema:** `AnnouncementSignatureSchema`
- **Error Responses:**
  - `403 Forbidden`: Signer is not Tier 3.
  - `409 Conflict`: User has already signed this announcement (`duplicate_signature_violation`).
  - `400 Bad Request`: Announcement is already published.
- **Intended RLS Rules:** Handled in secure Postgres stored procedure with transaction locks.
- **Query Keys to Invalidate:** `QueryKeys.signatures(announcementId)`, `QueryKeys.announcements(movementId)`

---

### Tasks Board, Claims & Peer Verification

#### `getTasks(movementId: string)`
- **Signature:** `getTasks(movementId: string): Promise<Task[]>`
- **Proposed Route & Method:** `GET /rest/v1/tasks?movement_id=eq.{movementId}&select=*&order=created_at.desc`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** `movementId: uuid`
- **Response Schema:** `z.array(TaskSchema)`
- **Error Responses:** `401 Unauthorized`.
- **Intended RLS Rules:** `SELECT` allowed for all movement members.
- **Query Keys to Invalidate:** `QueryKeys.tasks(movementId)`

#### `getTask(taskId: string)`
- **Signature:** `getTask(taskId: string): Promise<Task>`
- **Proposed Route & Method:** `GET /rest/v1/tasks?id=eq.{taskId}&single=true`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** `taskId: uuid`
- **Response Schema:** `TaskSchema`
- **Error Responses:** `404 Not Found`.
- **Intended RLS Rules:** `SELECT` allowed for all members.
- **Query Keys to Invalidate:** `QueryKeys.task(taskId)`

#### `createTask(input: CreateTaskInput, creatorId: string)`
- **Signature:** `createTask(input: CreateTaskInput, creatorId: string): Promise<Task>`
- **Proposed Route & Method:** `POST /rest/v1/tasks`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Tier 3 Organizer only (`get_user_tier(auth.uid()) = 3`).
- **Request Schema:** `CreateTaskSchema`
- **Response Schema:** `TaskSchema`
- **Error Responses:** `403 Forbidden` if not Tier 3; `400 Bad Request` if invalid parameters.
- **Intended RLS Rules:** `INSERT WITH CHECK (get_user_tier(auth.uid()) = 3 AND created_by = auth.uid())`
- **Query Keys to Invalidate:** `QueryKeys.tasks(input.movement_id)`

#### `claimTask(input: ClaimTaskInput, claimantId: string)`
- **Signature:** `claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim>`
- **Proposed Route & Method:** `POST /rest/v1/rpc/claim_task`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Claimant cannot be task creator).
- **Request Schema:** `ClaimTaskSchema`
- **Response Schema:** `TaskClaimSchema`
- **Error Responses:**
  - `409 Conflict`: Double claim attempt by same user.
  - `403 Forbidden`: Creator attempting to claim own task.
  - `400 Bad Request`: Task capacity full or task status not open.
- **Intended RLS Rules:** Protected via transactional RPC to eliminate race conditions on volunteer capacity.
- **Query Keys to Invalidate:** `QueryKeys.taskClaims()`, `QueryKeys.tasks(movementId)`

#### `markClaimComplete(claimId: string, claimantId: string, note?: string)`
- **Signature:** `markClaimComplete(claimId: string, claimantId: string, note?: string): Promise<TaskClaim>`
- **Proposed Route & Method:** `POST /rest/v1/rpc/mark_claim_complete`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Claimant only (`auth.uid() = claim.claimed_by`).
- **Request Schema:** `{ claim_id: uuid, claimant_id: uuid, note?: string }`
- **Response Schema:** `TaskClaimSchema`
- **Error Responses:** `403 Forbidden` if user is not the claimant; `400 Bad Request` if claim not in_progress.
- **Intended RLS Rules:** Assigns 3 eligible verifiers excluding the claimant upon status transition to `pending_verification`.
- **Query Keys to Invalidate:** `QueryKeys.taskClaims()`, `QueryKeys.tasks(movementId)`

#### `getPeerVerifications(claimId?: string)`
- **Signature:** `getPeerVerifications(claimId?: string): Promise<PeerVerification[]>`
- **Proposed Route & Method:** `GET /rest/v1/peer_verifications?claim_id=eq.{claimId}`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** `claimId?: uuid`
- **Response Schema:** `z.array(PeerVerificationSchema)`
- **Error Responses:** `401 Unauthorized`.
- **Intended RLS Rules:** `SELECT` allowed for assigned verifiers, the claimant, and Tier 3 organizers.
- **Query Keys to Invalidate:** `QueryKeys.peerVerifications(claimId)`

#### `submitVerificationVote(claimId: string, verifierId: string, vote: VerificationVoteType)`
- **Signature:** `submitVerificationVote(claimId: string, verifierId: string, vote: VerificationVoteType): Promise<PeerVerification>`
- **Proposed Route & Method:** `POST /rest/v1/rpc/submit_verification_vote`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Tier 2 or 3; user must be an assigned verifier; claimant cannot vote.
- **Request Schema:** `{ claim_id: uuid, verifier_id: uuid, vote: 'approve' | 'reject' }`
- **Response Schema:** `PeerVerificationSchema`
- **Error Responses:** `403 Forbidden` (self-verification or unassigned); `409 Conflict` (already voted).
- **Intended RLS Rules:** Atomic consensus evaluation (threshold = 2 approvals). Issues impact badge and ledger record upon consensus.
- **Query Keys to Invalidate:** `QueryKeys.peerVerifications(claimId)`, `QueryKeys.taskClaims()`, `QueryKeys.tasks(movementId)`, `["impactLedger"]`

#### `organizerOverride(claimId: string, organizerId: string, approve: boolean, note?: string)`
- **Signature:** `organizerOverride(claimId: string, organizerId: string, approve: boolean, note?: string): Promise<TaskClaim>`
- **Proposed Route & Method:** `POST /rest/v1/rpc/organizer_override`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Tier 3 Organizer only (`get_user_tier(auth.uid()) = 3`).
- **Request Schema:** `{ claim_id: uuid, organizer_id: uuid, approve: boolean, note?: string }`
- **Response Schema:** `TaskClaimSchema`
- **Error Responses:** `403 Forbidden` if not Tier 3; `404 Not Found` if claim does not exist.
- **Intended RLS Rules:** Finalizes claim immediately to `verified` or `rejected`. Issues badge and impact ledger entry.
- **Query Keys to Invalidate:** `QueryKeys.taskClaims()`, `QueryKeys.tasks(movementId)`, `["impactLedger"]`

---

### Location Telemetry & Heatmap

#### `getAggregatedCheckInPoints()`
- **Signature:** `getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]>`
- **Proposed Route & Method:** `GET /rest/v1/aggregated_heatmap_view`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated (Tier 1, 2, or 3).
- **Request Schema:** None.
- **Response Schema:** `z.array(AggregatedCheckInPointSchema)`
- **Error Responses:** `401 Unauthorized`.
- **Intended RLS Rules:** View returns spatial clusters rounded to 3 decimal places (~110m). Individual user coordinates are strictly hidden.
- **Query Keys to Invalidate:** `QueryKeys.aggregatedHeatmap()`

#### `checkIn(input: CreateCheckInInput, userId: string)`
- **Signature:** `checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn>`
- **Proposed Route & Method:** `POST /rest/v1/check_ins`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Authenticated volunteer (`auth.uid() = userId`).
- **Request Schema:** `CreateCheckInSchema`
- **Response Schema:** `CheckInSchema`
- **Error Responses:** `400 Bad Request` if lat/lng out of bounds; `401 Unauthorized`.
- **Intended RLS Rules:** `INSERT WITH CHECK (auth.uid() = user_id)`. Trigger truncates lat/lng to 3 decimal places prior to storage.
- **Query Keys to Invalidate:** `QueryKeys.aggregatedHeatmap()`, `QueryKeys.checkIns(movementId)`

---

### Profiles, Badges & Impact Ledger

#### `getUserProfile(userId: string)`
- **Signature:** `getUserProfile(userId: string): Promise<User>`
- **Proposed Route & Method:** `GET /rest/v1/user_profiles?id=eq.{userId}&single=true`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Public / Authenticated.
- **Request Schema:** `userId: string`
- **Response Schema:** `UserSchema`
- **Error Responses:** `404 Not Found` ("User profile not found").
- **Intended RLS Rules:** Publicly readable display name and tier. Personal email/phone remain private in `auth.users`.
- **Query Keys to Invalidate:** `["userProfile", userId]`

#### `getUserBadges(userId: string)`
- **Signature:** `getUserBadges(userId: string): Promise<Badge[]>`
- **Proposed Route & Method:** `GET /rest/v1/badges?user_id=eq.{userId}&select=*`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Public / Authenticated.
- **Request Schema:** `userId: string`
- **Response Schema:** `z.array(BadgeSchema)`
- **Error Responses:** `404 Not Found`.
- **Intended RLS Rules:** Publicly readable recognition badges.
- **Query Keys to Invalidate:** `["userBadges", userId]`

#### `getImpactLedger(userId: string)`
- **Signature:** `getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]>`
- **Proposed Route & Method:** `GET /rest/v1/impact_ledger?user_id=eq.{userId}&order=verified_at.desc`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Public / Authenticated.
- **Request Schema:** `userId: string`
- **Response Schema:** `z.array(ImpactLedgerEntrySchema)`
- **Error Responses:** `404 Not Found`.
- **Intended RLS Rules:** Publicly verifiable historical ledger of completed tasks and awarded points.
- **Query Keys to Invalidate:** `["impactLedger", userId]`

#### `getUserStats(userId: string)`
- **Signature:** `getUserStats(userId: string): Promise<UserStats>`
- **Proposed Route & Method:** `GET /rest/v1/rpc/get_user_stats?user_id={userId}`
- **Status:** Proposed, backend teammate to implement.
- **Auth & Tier:** Public / Authenticated.
- **Request Schema:** `userId: string`
- **Response Schema:** `{ tasksCompleted: number, announcementsSigned: number, checkInsCount: number, impactPoints: number }`
- **Error Responses:** `404 Not Found`.
- **Intended RLS Rules:** Aggregated deterministic summary calculated from verified ledger records.
- **Query Keys to Invalidate:** `["userStats", userId]`
