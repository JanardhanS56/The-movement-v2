-- ============================================================================
-- Migration: 20261103_phase3_badge_triggers.sql
-- Checkpoint 4.2: Automated Milestone Badge Awarding Triggers
-- Safe to re-run: Uses IF NOT EXISTS, OR REPLACE, and idempotent statements.
-- ============================================================================

-- 1. Relax or update badge_type and issued_by check constraints
ALTER TABLE public.badges
DROP CONSTRAINT IF EXISTS badges_badge_type_check;

ALTER TABLE public.badges
ADD CONSTRAINT badges_badge_type_check
CHECK (badge_type IN (
  'task_complete',
  'organizer_verified',
  'early_adopter',
  'movement_founder',
  'first_step',
  'reliable_responder',
  'community_pillar'
));

ALTER TABLE public.badges
DROP CONSTRAINT IF EXISTS badges_issued_by_check;

ALTER TABLE public.badges
ADD CONSTRAINT badges_issued_by_check
CHECK (issued_by IN ('peer_vote', 'organizer_override', 'system'));

-- 2. Add unique partial index to prevent duplicate milestone badges
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_milestone_badge
ON public.badges(user_id, badge_type)
WHERE claim_id IS NULL;

-- 3. Core Milestone Badge Evaluator Function
CREATE OR REPLACE FUNCTION public.evaluate_user_milestone_badges(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_verified_count INTEGER;
  v_impact_points INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- 1. Count verified task claims
  SELECT COUNT(*) INTO v_verified_count
  FROM public.task_claims
  WHERE claimed_by = p_user_id AND status = 'verified';

  -- 2. Fetch current impact points
  SELECT COALESCE(impact_points, 0) INTO v_impact_points
  FROM public.users
  WHERE id = p_user_id;

  -- Milestone 1: First verified task completed -> 'first_step'
  IF v_verified_count >= 1 THEN
    INSERT INTO public.badges (
      user_id,
      claim_id,
      badge_type,
      badge_label,
      issued_by,
      metadata
    ) VALUES (
      p_user_id,
      NULL,
      'first_step',
      'First Step',
      'system',
      jsonb_build_object('milestone', '1_verified_task', 'awarded_count', v_verified_count)
    )
    ON CONFLICT (user_id, badge_type) WHERE claim_id IS NULL DO NOTHING;
  END IF;

  -- Milestone 2: 5 verified tasks completed -> 'reliable_responder'
  IF v_verified_count >= 5 THEN
    INSERT INTO public.badges (
      user_id,
      claim_id,
      badge_type,
      badge_label,
      issued_by,
      metadata
    ) VALUES (
      p_user_id,
      NULL,
      'reliable_responder',
      'Reliable Responder',
      'system',
      jsonb_build_object('milestone', '5_verified_tasks', 'awarded_count', v_verified_count)
    )
    ON CONFLICT (user_id, badge_type) WHERE claim_id IS NULL DO NOTHING;
  END IF;

  -- Milestone 3: 500 total impact points reached -> 'community_pillar'
  IF v_impact_points >= 500 THEN
    INSERT INTO public.badges (
      user_id,
      claim_id,
      badge_type,
      badge_label,
      issued_by,
      metadata
    ) VALUES (
      p_user_id,
      NULL,
      'community_pillar',
      'Community Pillar',
      'system',
      jsonb_build_object('milestone', '500_impact_points', 'points', v_impact_points)
    )
    ON CONFLICT (user_id, badge_type) WHERE claim_id IS NULL DO NOTHING;
  END IF;
END;
$$;

-- 4. Trigger wrappers
CREATE OR REPLACE FUNCTION public.trg_evaluate_badges_on_claim_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    PERFORM public.evaluate_user_milestone_badges(NEW.claimed_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_claim_verified_milestone_badges ON public.task_claims;
CREATE TRIGGER on_claim_verified_milestone_badges
  AFTER UPDATE OF status ON public.task_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_evaluate_badges_on_claim_change();

CREATE OR REPLACE FUNCTION public.trg_evaluate_badges_on_user_points_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.impact_points IS DISTINCT FROM OLD.impact_points THEN
    PERFORM public.evaluate_user_milestone_badges(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_points_milestone_badges ON public.users;
CREATE TRIGGER on_user_points_milestone_badges
  AFTER UPDATE OF impact_points ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_evaluate_badges_on_user_points_change();
