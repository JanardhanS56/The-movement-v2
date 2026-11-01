-- Migration: 20261101_phase1_init_schema.sql
-- The Movement: Phase 1 Database Schema, Functions, Triggers, Indexes & RLS Policies

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- 2.1 users (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  avatar_url    TEXT,
  tier          SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 movements
CREATE TABLE IF NOT EXISTS public.movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description   TEXT,
  slug          TEXT UNIQUE NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 movement_members
CREATE TABLE IF NOT EXISTS public.movement_members (
  movement_id   UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'organizer', 'admin')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (movement_id, user_id)
);

-- 2.4 announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id           UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.users(id),
  title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  body                  TEXT NOT NULL CHECK (char_length(body) >= 10),
  required_signatures   SMALLINT NOT NULL DEFAULT 2 CHECK (required_signatures >= 1 AND required_signatures <= 10),
  is_published          BOOLEAN NOT NULL DEFAULT false,
  published_at          TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 announcement_signatures
CREATE TABLE IF NOT EXISTS public.announcement_signatures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  signed_by       UUID NOT NULL REFERENCES public.users(id),
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, signed_by)
);

-- 2.6 tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id           UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES public.users(id),
  title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description           TEXT CHECK (char_length(description) <= 2000),
  reward_points         INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0 AND reward_points <= 10000),
  required_volunteers   SMALLINT NOT NULL DEFAULT 1 CHECK (required_volunteers >= 1 AND required_volunteers <= 100),
  status                TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_verification', 'completed', 'cancelled')),
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 task_claims
CREATE TABLE IF NOT EXISTS public.task_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  claimed_by  UUID NOT NULL REFERENCES public.users(id),
  status      TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'pending_verification', 'verified', 'rejected', 'withdrawn')),
  note        TEXT CHECK (char_length(note) <= 500),
  proof_url   TEXT,
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (task_id, claimed_by)
);

-- 2.8 peer_verifications
CREATE TABLE IF NOT EXISTS public.peer_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID NOT NULL REFERENCES public.task_claims(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES public.users(id),
  vote        TEXT CHECK (vote IN ('approve', 'reject')),
  voted_at    TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  UNIQUE (claim_id, verifier_id)
);

-- 2.9 badges
CREATE TABLE IF NOT EXISTS public.badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_id        UUID REFERENCES public.task_claims(id) ON DELETE SET NULL,
  badge_type      TEXT NOT NULL CHECK (badge_type IN ('task_complete', 'organizer_verified', 'early_adopter', 'movement_founder')),
  badge_label     TEXT NOT NULL,
  issued_by       TEXT NOT NULL CHECK (issued_by IN ('peer_vote', 'organizer_override')),
  issued_by_user  UUID REFERENCES public.users(id),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 check_ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id   UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lat           DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng           DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy      REAL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FUNCTIONS & TRIGGERS

-- 3.1 Auth trigger to create public user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'tier')::SMALLINT, 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3.2 Announcement multi-sig threshold check
CREATE OR REPLACE FUNCTION public.check_announcement_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required     SMALLINT;
  v_current      INTEGER;
  v_is_published BOOLEAN;
BEGIN
  SELECT required_signatures, is_published
  INTO v_required, v_is_published
  FROM public.announcements
  WHERE id = NEW.announcement_id;

  IF v_is_published THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM public.announcement_signatures
  WHERE announcement_id = NEW.announcement_id;

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

DROP TRIGGER IF EXISTS on_announcement_signed ON public.announcement_signatures;
CREATE TRIGGER on_announcement_signed
  AFTER INSERT ON public.announcement_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.check_announcement_threshold();

-- 3.3 Peer verification threshold check
CREATE OR REPLACE FUNCTION public.check_peer_verification_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approvals    INTEGER;
  v_rejections   INTEGER;
  v_claim_status TEXT;
  v_claim_user   UUID;
  v_task_title   TEXT;
BEGIN
  IF NEW.vote IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tc.status, tc.claimed_by, t.title
  INTO v_claim_status, v_claim_user, v_task_title
  FROM public.task_claims tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE tc.id = NEW.claim_id;

  IF v_claim_status IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_approvals
  FROM public.peer_verifications
  WHERE claim_id = NEW.claim_id AND vote = 'approve';

  SELECT COUNT(*) INTO v_rejections
  FROM public.peer_verifications
  WHERE claim_id = NEW.claim_id AND vote = 'reject';

  IF v_approvals >= 2 THEN
    UPDATE public.task_claims
    SET status = 'verified',
        verified_at = now()
    WHERE id = NEW.claim_id;

    INSERT INTO public.badges (user_id, claim_id, badge_type, badge_label, issued_by, metadata)
    VALUES (
      v_claim_user,
      NEW.claim_id,
      'task_complete',
      v_task_title,
      'peer_vote',
      jsonb_build_object('task_title', v_task_title)
    );
  ELSIF v_rejections >= 2 THEN
    UPDATE public.task_claims
    SET status = 'rejected'
    WHERE id = NEW.claim_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_peer_vote_cast ON public.peer_verifications;
CREATE TRIGGER on_peer_vote_cast
  AFTER INSERT OR UPDATE OF vote ON public.peer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_peer_verification_threshold();

-- 3.4 Assign random peer verifiers
CREATE OR REPLACE FUNCTION public.assign_peer_verifiers(p_claim_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  INSERT INTO public.peer_verifications (claim_id, verifier_id)
  SELECT p_claim_id, mm.user_id
  FROM public.movement_members mm
  JOIN public.users u ON u.id = mm.user_id
  WHERE mm.movement_id = v_movement_id
    AND mm.user_id NOT IN (v_claimant, v_task_creator)
    AND u.tier >= 2
  ORDER BY random()
  LIMIT 3;
END;
$$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_movements_slug ON public.movements(slug);
CREATE INDEX IF NOT EXISTS idx_movements_created_by ON public.movements(created_by);
CREATE INDEX IF NOT EXISTS idx_movement_members_user ON public.movement_members(user_id);
CREATE INDEX IF NOT EXISTS idx_movement_members_movement ON public.movement_members(movement_id);
CREATE INDEX IF NOT EXISTS idx_announcements_movement ON public.announcements(movement_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(movement_id, is_published);
CREATE INDEX IF NOT EXISTS idx_signatures_announcement ON public.announcement_signatures(announcement_id);
CREATE INDEX IF NOT EXISTS idx_tasks_movement_status ON public.tasks(movement_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_task ON public.task_claims(task_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON public.task_claims(claimed_by);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.task_claims(status);
CREATE INDEX IF NOT EXISTS idx_peer_verif_claim ON public.peer_verifications(claim_id);
CREATE INDEX IF NOT EXISTS idx_peer_verif_verifier ON public.peer_verifications(verifier_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_claim ON public.badges(claim_id);
CREATE INDEX IF NOT EXISTS idx_checkins_movement_time ON public.check_ins(movement_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_time ON public.check_ins(user_id, checked_in_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- users policies
DROP POLICY IF EXISTS "Users: public read" ON public.users;
CREATE POLICY "Users: public read" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users: self update" ON public.users;
CREATE POLICY "Users: self update" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- movements policies
DROP POLICY IF EXISTS "Movements: authenticated read" ON public.movements;
CREATE POLICY "Movements: authenticated read" ON public.movements FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Movements: tier 3 create" ON public.movements;
CREATE POLICY "Movements: tier 3 create" ON public.movements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND tier = 3));

DROP POLICY IF EXISTS "Movements: creator update" ON public.movements;
CREATE POLICY "Movements: creator update" ON public.movements FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- movement_members policies
DROP POLICY IF EXISTS "MovementMembers: member read" ON public.movement_members;
CREATE POLICY "MovementMembers: member read" ON public.movement_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.movement_members mm WHERE mm.movement_id = movement_members.movement_id AND mm.user_id = auth.uid()));

-- announcements policies
DROP POLICY IF EXISTS "Announcements: anon read (published only)" ON public.announcements;
CREATE POLICY "Announcements: anon read (published only)" ON public.announcements FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "Announcements: members read (published only)" ON public.announcements;
CREATE POLICY "Announcements: members read (published only)" ON public.announcements FOR SELECT TO authenticated
  USING (is_published = true AND EXISTS (SELECT 1 FROM public.movement_members WHERE user_id = auth.uid() AND movement_id = announcements.movement_id));

DROP POLICY IF EXISTS "Announcements: organizers read pending" ON public.announcements;
CREATE POLICY "Announcements: organizers read pending" ON public.announcements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.movement_members mm ON mm.user_id = u.id
    WHERE u.id = auth.uid() AND u.tier = 3 AND mm.movement_id = announcements.movement_id
  ));

DROP POLICY IF EXISTS "Announcements: tier 3 members create" ON public.announcements;
CREATE POLICY "Announcements: tier 3 members create" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.movement_members mm ON mm.user_id = u.id
    WHERE u.id = auth.uid() AND u.tier = 3 AND mm.movement_id = announcements.movement_id
  ));

-- announcement_signatures policies
DROP POLICY IF EXISTS "Signatures: organizers read" ON public.announcement_signatures;
CREATE POLICY "Signatures: organizers read" ON public.announcement_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.tier = 3));

DROP POLICY IF EXISTS "Signatures: tier 3 self sign" ON public.announcement_signatures;
CREATE POLICY "Signatures: tier 3 self sign" ON public.announcement_signatures FOR INSERT TO authenticated
  WITH CHECK (signed_by = auth.uid() AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.tier = 3));

-- tasks policies
DROP POLICY IF EXISTS "Tasks: members read" ON public.tasks;
CREATE POLICY "Tasks: members read" ON public.tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.movement_members WHERE user_id = auth.uid() AND movement_id = tasks.movement_id));

DROP POLICY IF EXISTS "Tasks: tier 3 create" ON public.tasks;
CREATE POLICY "Tasks: tier 3 create" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.movement_members mm ON mm.user_id = u.id
    WHERE u.id = auth.uid() AND u.tier = 3 AND mm.movement_id = tasks.movement_id
  ));

-- task_claims policies
DROP POLICY IF EXISTS "Claims: members read" ON public.task_claims;
CREATE POLICY "Claims: members read" ON public.task_claims FOR SELECT TO authenticated
  USING (claimed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.movement_members mm ON mm.movement_id = t.movement_id
    WHERE t.id = task_claims.task_id AND mm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Claims: members self-claim" ON public.task_claims;
CREATE POLICY "Claims: members self-claim" ON public.task_claims FOR INSERT TO authenticated
  WITH CHECK (claimed_by = auth.uid());

DROP POLICY IF EXISTS "Claims: self or organizer update" ON public.task_claims;
CREATE POLICY "Claims: self or organizer update" ON public.task_claims FOR UPDATE TO authenticated
  USING (claimed_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.tier = 3));

-- peer_verifications policies
DROP POLICY IF EXISTS "PeerVerifications: self read" ON public.peer_verifications;
CREATE POLICY "PeerVerifications: self read" ON public.peer_verifications FOR SELECT TO authenticated
  USING (verifier_id = auth.uid());

DROP POLICY IF EXISTS "PeerVerifications: self vote" ON public.peer_verifications;
CREATE POLICY "PeerVerifications: self vote" ON public.peer_verifications FOR UPDATE TO authenticated
  USING (verifier_id = auth.uid() AND vote IS NULL)
  WITH CHECK (verifier_id = auth.uid());

-- badges policies
DROP POLICY IF EXISTS "Badges: public read" ON public.badges;
CREATE POLICY "Badges: public read" ON public.badges FOR SELECT USING (true);

-- check_ins policies
DROP POLICY IF EXISTS "CheckIns: members read" ON public.check_ins;
CREATE POLICY "CheckIns: members read" ON public.check_ins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.movement_members WHERE user_id = auth.uid() AND movement_id = check_ins.movement_id));

DROP POLICY IF EXISTS "CheckIns: self insert" ON public.check_ins;
CREATE POLICY "CheckIns: self insert" ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

