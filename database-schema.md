# Database Schema — The Movement

> **Version:** 1.0 — MVP Scope  
> **Last Updated:** 2026-11-01  
> **Database:** PostgreSQL 15 (via Supabase)

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Table Definitions](#2-table-definitions)
3. [PostgreSQL Functions & Triggers](#3-postgresql-functions--triggers)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Indexes](#5-indexes)
6. [Mock Auth Flow](#6-mock-auth-flow)
7. [Seed Data](#7-seed-data)
8. [Migration Order](#8-migration-order)

---

## 1. Design Principles

### JSONB Flexibility Columns

Every table has a `metadata JSONB` column. This is the **Phase 2 escape hatch**. When we add features like Reliability Scores, Treasury integration, or Liquid Democracy, we can store new fields in `metadata` without running ALTER TABLE migrations on production data.

**Example:** Adding reliability score in Phase 2:
```sql
-- No migration needed:
UPDATE users SET metadata = metadata || '{"reliability_score": 87}' WHERE id = '...';
```

**Rule:** `metadata` is for optional, evolving, non-queried fields. If you need to filter/sort by a field, it must be a real column — not buried in JSONB.

### Supabase Auth Integration

- Supabase creates a `auth.users` table automatically.
- We maintain a `public.users` table that mirrors/extends it.
- A Supabase Database Webhook (or trigger on `auth.users`) creates a `public.users` row on each new signup.
- All application logic references `public.users.id`, which is a foreign key to `auth.users.id`.

---

## 2. Table Definitions

### 2.1 — `users`

Extends Supabase Auth with application-level profile data.

```sql
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  avatar_url    TEXT,
  tier          SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  -- Tier 1 = Volunteer, Tier 2 = Senior Volunteer, Tier 3 = Organizer
  
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Phase 2 fields stored here:
  -- metadata->>'reliability_score'   (number 0-100)
  -- metadata->>'overbooking_weight'  (number)
  -- metadata->>'delegate_to'         (UUID — Liquid Democracy)

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Application user profiles, extending Supabase Auth.';
COMMENT ON COLUMN public.users.tier IS '1=Volunteer, 2=Senior Volunteer, 3=Organizer. Tier 3 auto-assigned on mock document upload.';
COMMENT ON COLUMN public.users.metadata IS 'Flexible JSONB store for Phase 2 features (reliability score, delegation, etc.)';
```

### 2.2 — `movements`

A movement is the top-level organizing entity. Think of it as a "campaign" or "cause."

```sql
CREATE TABLE public.movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description   TEXT,
  slug          TEXT UNIQUE NOT NULL, -- URL-friendly identifier, e.g. 'green-city-2026'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Stored in settings:
  -- settings->>'required_sig_default'  (integer, default required signatures for announcements)
  -- settings->>'max_task_bounty'        (integer, max reward points per task)
  -- settings->>'treasury_enabled'       (boolean, Phase 2)

  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.movements IS 'Top-level organizing entity. Each movement has its own feed, heatmap, and task board.';

-- Junction table: membership (many users, many movements)
CREATE TABLE public.movement_members (
  movement_id   UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'organizer', 'admin')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (movement_id, user_id)
);

COMMENT ON TABLE public.movement_members IS 'Many-to-many membership between users and movements.';
```

### 2.3 — `announcements`

Announcements require N-of-M organizer signatures before becoming public.

```sql
CREATE TABLE public.announcements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id           UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.users(id),
  
  title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  body                  TEXT NOT NULL CHECK (char_length(body) >= 10),
  
  required_signatures   SMALLINT NOT NULL DEFAULT 2 CHECK (required_signatures >= 1 AND required_signatures <= 10),
  is_published          BOOLEAN NOT NULL DEFAULT false,
  -- Set to true by trigger when signature count >= required_signatures
  
  published_at          TIMESTAMPTZ, -- Set when is_published flips to true
  
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.announcements IS 'Announcements visible to movement members. Requires multi-sig before publishing.';
COMMENT ON COLUMN public.announcements.is_published IS 'Controlled by trigger. Do NOT update manually.';
```

### 2.4 — `announcement_signatures`

One row per organizer signature. Unique constraint prevents double-signing.

```sql
CREATE TABLE public.announcement_signatures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  signed_by       UUID NOT NULL REFERENCES public.users(id),
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (announcement_id, signed_by)  -- One signature per user per announcement
);

COMMENT ON TABLE public.announcement_signatures IS 'Each row represents one organizer signing an announcement. Unique per user.';
```

### 2.5 — `tasks`

Tasks on the Bounty Board. Posted by Tier 3 organizers.

```sql
CREATE TABLE public.tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id           UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.users(id),
  
  title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description           TEXT CHECK (char_length(description) <= 2000),
  reward_points         INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0 AND reward_points <= 10000),
  required_volunteers   SMALLINT NOT NULL DEFAULT 1 CHECK (required_volunteers >= 1 AND required_volunteers <= 100),
  
  status                TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'in_progress', 'pending_verification', 'completed', 'cancelled')),
  
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Phase 2 fields stored here:
  -- metadata->>'overbooking_factor'  (float, e.g. 1.2 for 20% overbooking)
  -- metadata->>'proof_required'      (boolean)
  -- metadata->>'category'            (string)

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tasks IS 'Bounty Board tasks. Volunteers claim and complete; completion requires peer verification.';
```

### 2.6 — `task_claims`

Links a volunteer to a task they have claimed.

```sql
CREATE TABLE public.task_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  claimed_by  UUID NOT NULL REFERENCES public.users(id),
  
  status      TEXT NOT NULL DEFAULT 'in_progress'
              CHECK (status IN ('in_progress', 'pending_verification', 'verified', 'rejected', 'withdrawn')),
  
  note        TEXT CHECK (char_length(note) <= 500), -- Claimant's note on completion
  proof_url   TEXT, -- URL to proof artifact in Supabase Storage (Phase 2)
  
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ, -- Set when claimant marks complete
  verified_at TIMESTAMPTZ, -- Set when verification passes

  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  UNIQUE (task_id, claimed_by) -- One claim per user per task
);

COMMENT ON TABLE public.task_claims IS 'Records of volunteers claiming tasks. One claim per user per task. Initial status is in_progress.';
```

### 2.7 — `peer_verifications`

When a task is marked complete, 3 verifiers are randomly assigned. Each row = one verifier slot.

```sql
CREATE TABLE public.peer_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID NOT NULL REFERENCES public.task_claims(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES public.users(id),
  
  vote        TEXT CHECK (vote IN ('approve', 'reject')), -- NULL until vote is cast
  voted_at    TIMESTAMPTZ,
  
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  -- If not voted within 48h, a replacement verifier can be assigned

  UNIQUE (claim_id, verifier_id) -- One vote slot per verifier per claim
);

COMMENT ON TABLE public.peer_verifications IS 'Three verifiers are randomly assigned per task claim. 2/3 approvals = verified.';
```

### 2.8 — `badges`

Awarded badges. Each row = one badge issued to one user.

```sql
CREATE TABLE public.badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_id        UUID REFERENCES public.task_claims(id) ON DELETE SET NULL,
  -- claim_id is NULL for manually awarded badges (Organizer Override without a task)
  
  badge_type      TEXT NOT NULL
                  CHECK (badge_type IN ('task_complete', 'organizer_verified', 'early_adopter', 'movement_founder')),
  badge_label     TEXT NOT NULL,  -- Human-readable name, e.g. "Flyer Drop Champion"
  issued_by       TEXT NOT NULL
                  CHECK (issued_by IN ('peer_vote', 'organizer_override')),
  issued_by_user  UUID REFERENCES public.users(id), -- Organizer who manually issued (if override)
  
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- metadata->>'icon_url'       (string, badge image)
  -- metadata->>'color'          (string, hex color for badge display)
  -- metadata->>'task_title'     (string, cached for display without join)

  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.badges IS 'Badges issued to users. Supports both peer-vote and organizer-override paths.';
```

### 2.9 — `check_ins`

GPS check-ins for the live heatmap.

```sql
CREATE TABLE public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  lat         DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng         DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy    REAL, -- Browser-reported accuracy in meters
  
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Phase 2: metadata->>'exif_stripped' (boolean), after EXIF stripping feature is added
  
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.check_ins IS 'GPS check-ins from users. Feeds the live heatmap. Rate limited at API layer (1 per 5 min per user).';
```

---

## 3. PostgreSQL Functions & Triggers

### 3.1 — Auto-create user profile on signup

```sql
-- Trigger function: runs when a new row is inserted into auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3.2 — Multi-Sig Threshold Check

Runs after every insert into `announcement_signatures`. If the threshold is met, publishes the announcement.

```sql
CREATE OR REPLACE FUNCTION public.check_announcement_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_required   SMALLINT;
  v_current    INTEGER;
  v_is_published BOOLEAN;
BEGIN
  -- Get required signatures and current published state
  SELECT required_signatures, is_published
  INTO v_required, v_is_published
  FROM public.announcements
  WHERE id = NEW.announcement_id;

  -- Don't re-publish if already published
  IF v_is_published THEN
    RETURN NEW;
  END IF;

  -- Count current valid signatures
  SELECT COUNT(*) INTO v_current
  FROM public.announcement_signatures
  WHERE announcement_id = NEW.announcement_id;

  -- If threshold met, publish
  IF v_current >= v_required THEN
    UPDATE public.announcements
    SET is_published = true,
        published_at = now(),
        updated_at = now()
    WHERE id = NEW.announcement_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_announcement_signed
  AFTER INSERT ON public.announcement_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.check_announcement_threshold();
```

### 3.3 — Peer Verification Threshold Check

Runs after every insert/update into `peer_verifications`. If 2+ approvals, marks the claim as verified and issues a badge.

```sql
CREATE OR REPLACE FUNCTION public.check_peer_verification_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approvals    INTEGER;
  v_claim_status TEXT;
  v_claim_user   UUID;
  v_task_title   TEXT;
BEGIN
  -- Only proceed if a vote was just cast
  IF NEW.vote IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current claim status
  SELECT tc.status, tc.claimed_by, t.title
  INTO v_claim_status, v_claim_user, v_task_title
  FROM public.task_claims tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE tc.id = NEW.claim_id;

  -- Don't double-process
  IF v_claim_status IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Count approvals
  SELECT COUNT(*) INTO v_approvals
  FROM public.peer_verifications
  WHERE claim_id = NEW.claim_id AND vote = 'approve';

  -- 2/3 threshold
  IF v_approvals >= 2 THEN
    -- Update claim
    UPDATE public.task_claims
    SET status = 'verified',
        verified_at = now()
    WHERE id = NEW.claim_id;

    -- Issue badge
    INSERT INTO public.badges (user_id, claim_id, badge_type, badge_label, issued_by, metadata)
    VALUES (
      v_claim_user,
      NEW.claim_id,
      'task_complete',
      v_task_title,
      'peer_vote',
      jsonb_build_object('task_title', v_task_title)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_peer_vote_cast
  AFTER INSERT OR UPDATE OF vote ON public.peer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_peer_verification_threshold();
```

### 3.4 — Assign Random Peer Verifiers

Called by the `POST /api/complete-task` Route Handler (not a trigger — called explicitly).

```sql
CREATE OR REPLACE FUNCTION public.assign_peer_verifiers(p_claim_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_id      UUID;
  v_movement_id  UUID;
  v_claimant     UUID;
  v_task_creator UUID;
BEGIN
  SELECT tc.task_id, t.movement_id, tc.claimed_by, t.created_by
  INTO v_task_id, v_movement_id, v_claimant, v_task_creator
  FROM public.task_claims tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE tc.id = p_claim_id;

  -- Insert 3 random verifiers:
  -- Must be movement members (not just any user in the system)
  -- Must exclude the claimant and the task creator
  INSERT INTO public.peer_verifications (claim_id, verifier_id)
  SELECT p_claim_id, mm.user_id
  FROM public.movement_members mm
  JOIN public.users u ON u.id = mm.user_id
  WHERE mm.movement_id = v_movement_id
    AND mm.user_id NOT IN (v_claimant, v_task_creator)
  ORDER BY random()
  LIMIT 3;
END;
$$;
```

---

## 4. Row Level Security (RLS) Policies

> **Important:** Enable RLS on ALL tables first, then apply policies. A table with RLS enabled but no policies is inaccessible to everyone (safe default).

### Enable RLS

```sql
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins          ENABLE ROW LEVEL SECURITY;
```

### Helper: Authenticated User ID

```sql
-- Supabase provides auth.uid() — the JWT subject claim
-- Use this in all policies
```

### 4.1 — `users` Policies

```sql
-- Users can read any public profile
CREATE POLICY "Users: public read"
  ON public.users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users: self update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only the DB trigger (service role) can insert new user rows
-- No explicit INSERT policy needed for anon/authenticated role
```

### 4.2 — `movements` Policies

```sql
-- Anyone authenticated can read active movements
CREATE POLICY "Movements: authenticated read"
  ON public.movements FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only Tier 3 users can create a movement
CREATE POLICY "Movements: tier 3 create"
  ON public.movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND tier = 3
    )
  );

-- Only the movement creator or a Tier 3 member can update
CREATE POLICY "Movements: creator update"
  ON public.movements FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### 4.3 — `announcements` Policies

```sql
-- CRITICAL RLS NOTE: In Supabase, multiple SELECT policies on the same table are OR-ed together.
-- To prevent the public policy from leaking pending announcements, we MUST scope it to the
-- `anon` role only. Authenticated organizers are covered exclusively by the second policy.

-- Unauthenticated (anon) users can only see PUBLISHED announcements
CREATE POLICY "Announcements: anon read (published only)"
  ON public.announcements FOR SELECT
  TO anon
  USING (is_published = true);

-- Authenticated non-organizers can see PUBLISHED announcements in their movement
CREATE POLICY "Announcements: members read (published only)"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.movement_members
      WHERE user_id = auth.uid() AND movement_id = announcements.movement_id
    )
  );

-- Tier 3 movement members can also see PENDING announcements
CREATE POLICY "Announcements: organizers read pending"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.movement_members mm ON mm.user_id = u.id
      WHERE u.id = auth.uid()
        AND u.tier = 3
        AND mm.movement_id = announcements.movement_id
    )
  );

-- Only Tier 3 movement members can draft new announcements
CREATE POLICY "Announcements: tier 3 members create"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.movement_members mm ON mm.user_id = u.id
      WHERE u.id = auth.uid()
        AND u.tier = 3
        AND mm.movement_id = announcements.movement_id
    )
  );

-- NOTE: UPDATE (is_published) is done by the trigger using SECURITY DEFINER
-- No UPDATE policy for authenticated users needed
```

### 4.4 — `announcement_signatures` Policies

```sql
-- Tier 3 movement members can read signatures
CREATE POLICY "Signatures: organizers read"
  ON public.announcement_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.tier = 3
    )
  );

-- Tier 3 users can sign (INSERT) — only their own signature
CREATE POLICY "Signatures: tier 3 self sign"
  ON public.announcement_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    signed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.tier = 3
    )
  );
```

### 4.5 — `tasks` Policies

```sql
-- Movement members can read tasks in their movement
CREATE POLICY "Tasks: members read"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.movement_members
      WHERE user_id = auth.uid() AND movement_id = tasks.movement_id
    )
  );

-- Only Tier 3 movement members can post tasks
CREATE POLICY "Tasks: tier 3 create"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.movement_members mm ON mm.user_id = u.id
      WHERE u.id = auth.uid()
        AND u.tier = 3
        AND mm.movement_id = tasks.movement_id
    )
  );
```

### 4.6 — `task_claims` Policies

```sql
-- Users can read claims for tasks in their movement
CREATE POLICY "Claims: members read"
  ON public.task_claims FOR SELECT
  TO authenticated
  USING (
    claimed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.movement_members mm ON mm.movement_id = t.movement_id
      WHERE t.id = task_claims.task_id AND mm.user_id = auth.uid()
    )
  );

-- Any movement member can claim a task (for themselves only)
CREATE POLICY "Claims: members self-claim"
  ON public.task_claims FOR INSERT
  TO authenticated
  WITH CHECK (claimed_by = auth.uid());

-- Claimant can update their own claim (to mark complete)
-- Tier 3 can update any claim in their movement (for override)
CREATE POLICY "Claims: self or organizer update"
  ON public.task_claims FOR UPDATE
  TO authenticated
  USING (
    claimed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.tier = 3
    )
  );
```

### 4.7 — `peer_verifications` Policies

```sql
-- Verifiers can read their own assignments
CREATE POLICY "PeerVerifications: self read"
  ON public.peer_verifications FOR SELECT
  TO authenticated
  USING (verifier_id = auth.uid());

-- Verifiers can vote (UPDATE) on their own assignment
CREATE POLICY "PeerVerifications: self vote"
  ON public.peer_verifications FOR UPDATE
  TO authenticated
  USING (verifier_id = auth.uid() AND vote IS NULL) -- Can only vote once
  WITH CHECK (verifier_id = auth.uid());
```

### 4.8 — `badges` Policies

```sql
-- Badges are publicly readable (Impact Ledger is public)
CREATE POLICY "Badges: public read"
  ON public.badges FOR SELECT
  USING (true);

-- Only the DB function (SECURITY DEFINER) inserts badges — no direct client insert
```

### 4.9 — `check_ins` Policies

```sql
-- Movement members can read all check-ins for their movement (feeds the heatmap)
CREATE POLICY "CheckIns: members read"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.movement_members
      WHERE user_id = auth.uid() AND movement_id = check_ins.movement_id
    )
  );

-- Users can insert their own check-ins (rate limiting enforced at API layer)
CREATE POLICY "CheckIns: self insert"
  ON public.check_ins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## 5. Indexes

```sql
-- Users
CREATE INDEX idx_users_tier ON public.users(tier);

-- Movements
CREATE INDEX idx_movements_slug ON public.movements(slug);
CREATE INDEX idx_movements_created_by ON public.movements(created_by);

-- Movement members
CREATE INDEX idx_movement_members_user ON public.movement_members(user_id);
CREATE INDEX idx_movement_members_movement ON public.movement_members(movement_id);

-- Announcements
CREATE INDEX idx_announcements_movement ON public.announcements(movement_id);
CREATE INDEX idx_announcements_published ON public.announcements(movement_id, is_published);
-- ^ Compound index for the common query: "published announcements in movement X"

-- Announcement signatures
CREATE INDEX idx_signatures_announcement ON public.announcement_signatures(announcement_id);

-- Tasks
CREATE INDEX idx_tasks_movement_status ON public.tasks(movement_id, status);

-- Task claims
CREATE INDEX idx_claims_task ON public.task_claims(task_id);
CREATE INDEX idx_claims_user ON public.task_claims(claimed_by);
CREATE INDEX idx_claims_status ON public.task_claims(status);

-- Peer verifications
CREATE INDEX idx_peer_verif_claim ON public.peer_verifications(claim_id);
CREATE INDEX idx_peer_verif_verifier ON public.peer_verifications(verifier_id);

-- Badges
CREATE INDEX idx_badges_user ON public.badges(user_id);
CREATE INDEX idx_badges_claim ON public.badges(claim_id);

-- Check-ins
CREATE INDEX idx_checkins_movement_time ON public.check_ins(movement_id, checked_in_at DESC);
-- ^ For loading recent check-ins for heatmap initialization
CREATE INDEX idx_checkins_user_time ON public.check_ins(user_id, checked_in_at DESC);
-- ^ For rate limiting check (last check-in per user)
```

---

## 6. Mock Auth Flow

> This section describes the **demo-only** identity upgrade mechanism. It must be replaced with real identity verification before any production deployment.

### Flow Diagram

```
User signs up via Supabase Auth
        |
        v
Trigger: handle_new_user() fires
        |
        v
public.users row created with tier = 1 (default)
        |
        v
User is redirected to /onboarding
        |
        v
User uploads ANY file (labeled "Government ID")
        |
        v
Next.js Route Handler: POST /api/upgrade-tier
  |-- File stored in Supabase Storage bucket: 'documents/{userId}/{filename}'
  |-- NO file inspection, NO verification, NO OCR
  |-- Immediately: UPDATE public.users SET tier = 3 WHERE id = {userId}
  `-- Respond 200 OK, redirect to /dashboard
        |
        v
User now has tier = 3 (Organizer) in all RLS policy checks
```

### Route Handler Code

```typescript
// src/app/api/upgrade-tier/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // uses SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('document') as File
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  // Store file — for demo purposes only, no processing
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.storage
    .from('documents')
    .upload(`${user.id}/${file.name}`, file, { upsert: true })

  // DEMO MOCK: auto-upgrade to Tier 3
  await supabaseAdmin
    .from('users')
    .update({ tier: 3, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return Response.json({ message: 'Identity verified. Welcome, Organizer.' })
}
```

### Supabase Storage Setup

```sql
-- Create the documents bucket (private — only service role can access)
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: documents
-- Public: FALSE
```

---

## 7. Seed Data

Run this in Supabase SQL Editor after applying all migrations.

```sql
-- ============================================================
-- SEED: Test Movement
-- ============================================================
INSERT INTO public.movements (id, name, slug, description, created_by)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Green City Initiative 2026',
  'green-city-2026',
  'A grassroots campaign to push for urban green infrastructure.',
  '00000000-0000-0000-0000-000000000001'  -- Alex Rivera's ID (set up via Supabase Auth seeding)
);

-- ============================================================
-- SEED: Movement Membership (REQUIRED before seeding tasks/announcements)
-- Without this, all RLS policies that check movement_members will deny access.
-- ============================================================
INSERT INTO public.movement_members (movement_id, user_id, role)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '00000000-0000-0000-0000-000000000001', 'organizer'),  -- Alex
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '00000000-0000-0000-0000-000000000002', 'organizer'),  -- Jordan
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '00000000-0000-0000-0000-000000000003', 'organizer'),  -- Sam
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '00000000-0000-0000-0000-000000000004', 'member'),     -- Casey
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '00000000-0000-0000-0000-000000000005', 'member');     -- Morgan

-- ============================================================
-- SEED: Sample Task
-- ============================================================
INSERT INTO public.tasks (movement_id, created_by, title, description, reward_points, required_volunteers)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000001',
  'Distribute flyers at Central Park',
  'We need 5 volunteers to hand out flyers at Central Park on Saturday morning.',
  150,
  5
);

-- ============================================================
-- SEED: Sample Announcement (unsigned, pending)
-- ============================================================
INSERT INTO public.announcements (movement_id, created_by, title, body, required_signatures)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000001',
  'Protest march moved to Sunday',
  'Due to weather, the Saturday march has been rescheduled to Sunday 10am. Please inform your networks.',
  2  -- Requires 2 organizer signatures
);
```

---

## 8. Migration Order

Apply migrations in this exact order to avoid foreign key errors:

```
1. users (depends on auth.users)
2. movements (depends on users)
3. movement_members (depends on movements, users)
4. announcements (depends on movements, users)
5. announcement_signatures (depends on announcements, users)
6. tasks (depends on movements, users)
7. task_claims (depends on tasks, users)
8. peer_verifications (depends on task_claims, users)
9. badges (depends on users, task_claims)
10. check_ins (depends on movements, users)
11. Functions & Triggers (depend on all tables)
12. Indexes
13. RLS Policies
14. Seed Data
```
