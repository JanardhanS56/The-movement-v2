-- ============================================================================
-- Migration: 20261103_phase3_consensus_triggers.sql
-- Checkpoint 4.1: Automated Quorum Vote Resolution Trigger
-- Safe to re-run: Uses IF NOT EXISTS, OR REPLACE, and idempotent statements.
-- ============================================================================

-- 1. Ensure impact_points column exists on public.users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS impact_points INTEGER NOT NULL DEFAULT 0;

-- 2. Create public.impact_ledger table for tamper-evident impact auditing
CREATE TABLE IF NOT EXISTS public.impact_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id             UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  claim_id            UUID REFERENCES public.task_claims(id) ON DELETE CASCADE,
  task_title          TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('peer_vote', 'organizer_override')),
  verified_by_detail  TEXT NOT NULL DEFAULT 'Peer Review Consensus (3/3)',
  reward_points       INTEGER NOT NULL DEFAULT 50,
  verified_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (claim_id)
);

CREATE INDEX IF NOT EXISTS idx_impact_ledger_user ON public.impact_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_ledger_task ON public.impact_ledger(task_id);

-- Enable RLS on impact_ledger
ALTER TABLE public.impact_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ImpactLedger: readable by all" ON public.impact_ledger;
CREATE POLICY "ImpactLedger: readable by all"
  ON public.impact_ledger FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "ImpactLedger: insertable by service role" ON public.impact_ledger;
CREATE POLICY "ImpactLedger: insertable by service role"
  ON public.impact_ledger FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Quorum Resolution Function
CREATE OR REPLACE FUNCTION public.check_peer_verification_quorum()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim_status TEXT;
  v_claim_user UUID;
  v_task_id UUID;
  v_task_title TEXT;
  v_reward_points INTEGER;
  v_approvals INTEGER;
  v_rejections INTEGER;
BEGIN
  -- If vote is null or unassigned, do nothing
  IF NEW.vote IS NULL THEN
    RETURN NEW;
  END IF;

  -- Load claim and task context
  SELECT tc.status, tc.claimed_by, tc.task_id, t.title, COALESCE(t.reward_points, 50)
  INTO v_claim_status, v_claim_user, v_task_id, v_task_title, v_reward_points
  FROM public.task_claims tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE tc.id = NEW.claim_id;

  -- Already resolved
  IF v_claim_status IN ('verified', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Count approvals and rejections
  SELECT COUNT(*) INTO v_approvals
  FROM public.peer_verifications
  WHERE claim_id = NEW.claim_id AND vote = 'approve';

  SELECT COUNT(*) INTO v_rejections
  FROM public.peer_verifications
  WHERE claim_id = NEW.claim_id AND vote = 'reject';

  -- Quorum rule: 3 approvals = verified (or >= 2 if only 2 verifiers assigned), 2 rejections = rejected
  IF v_approvals >= 3 OR (v_approvals >= 2 AND (SELECT COUNT(*) FROM public.peer_verifications WHERE claim_id = NEW.claim_id) <= 2) THEN
    -- 1. Mark claim as verified
    UPDATE public.task_claims
    SET status = 'verified',
        verified_at = now()
    WHERE id = NEW.claim_id;

    -- 2. Mark parent task as completed
    UPDATE public.tasks
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_task_id;

    -- 3. Atomically credit impact points to claimant
    UPDATE public.users
    SET impact_points = COALESCE(impact_points, 0) + v_reward_points
    WHERE id = v_claim_user;

    -- 4. Record ledger entry
    INSERT INTO public.impact_ledger (
      user_id,
      task_id,
      claim_id,
      task_title,
      verification_method,
      verified_by_detail,
      reward_points,
      verified_at
    ) VALUES (
      v_claim_user,
      v_task_id,
      NEW.claim_id,
      v_task_title,
      'peer_vote',
      'Peer Review Consensus Quorum Reached',
      v_reward_points,
      now()
    ) ON CONFLICT (claim_id) DO NOTHING;

    -- 5. Issue completion badge
    INSERT INTO public.badges (
      user_id,
      claim_id,
      badge_type,
      badge_label,
      issued_by,
      metadata
    ) VALUES (
      v_claim_user,
      NEW.claim_id,
      'task_complete',
      v_task_title,
      'peer_vote',
      jsonb_build_object('task_title', v_task_title, 'reward_points', v_reward_points)
    ) ON CONFLICT DO NOTHING;

  ELSIF v_rejections >= 2 THEN
    -- Mark claim as rejected
    UPDATE public.task_claims
    SET status = 'rejected'
    WHERE id = NEW.claim_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger to peer_verifications
DROP TRIGGER IF EXISTS on_peer_vote_cast ON public.peer_verifications;
DROP TRIGGER IF EXISTS on_peer_vote_quorum ON public.peer_verifications;

CREATE TRIGGER on_peer_vote_quorum
  AFTER INSERT OR UPDATE OF vote ON public.peer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_peer_verification_quorum();
