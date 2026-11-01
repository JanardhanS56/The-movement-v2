-- Migration: 20261101_phase1_fix_rls_recursion.sql
-- Fix infinite recursion in Row Level Security (RLS) policies by introducing SECURITY DEFINER helper functions

-- 1. Helper functions to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_movement_member(p_movement_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.movement_members
    WHERE movement_id = p_movement_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_movement_organizer(p_movement_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.movement_members mm ON mm.user_id = u.id
    WHERE u.id = p_user_id AND u.tier = 3 AND mm.movement_id = p_movement_id
  );
$$;

-- 2. MovementMembers policy: allow users to read their own memberships or other members in their movements
DROP POLICY IF EXISTS "MovementMembers: member read" ON public.movement_members;
CREATE POLICY "MovementMembers: member read" ON public.movement_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_movement_member(movement_id, auth.uid()));

-- 3. Announcements policies
DROP POLICY IF EXISTS "Announcements: members read (published only)" ON public.announcements;
CREATE POLICY "Announcements: members read (published only)" ON public.announcements FOR SELECT TO authenticated
  USING (is_published = true AND public.is_movement_member(movement_id, auth.uid()));

DROP POLICY IF EXISTS "Announcements: organizers read pending" ON public.announcements;
CREATE POLICY "Announcements: organizers read pending" ON public.announcements FOR SELECT TO authenticated
  USING (public.is_movement_organizer(movement_id, auth.uid()));

DROP POLICY IF EXISTS "Announcements: tier 3 members create" ON public.announcements;
CREATE POLICY "Announcements: tier 3 members create" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_movement_organizer(movement_id, auth.uid()));

-- 4. Tasks policies
DROP POLICY IF EXISTS "Tasks: members read" ON public.tasks;
CREATE POLICY "Tasks: members read" ON public.tasks FOR SELECT TO authenticated
  USING (public.is_movement_member(movement_id, auth.uid()));

DROP POLICY IF EXISTS "Tasks: tier 3 create" ON public.tasks;
CREATE POLICY "Tasks: tier 3 create" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_movement_organizer(movement_id, auth.uid()));

-- 5. Claims policies
DROP POLICY IF EXISTS "Claims: members read" ON public.task_claims;
CREATE POLICY "Claims: members read" ON public.task_claims FOR SELECT TO authenticated
  USING (claimed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tasks t WHERE t.id = task_claims.task_id AND public.is_movement_member(t.movement_id, auth.uid())
  ));

-- 6. Check-ins policies
DROP POLICY IF EXISTS "CheckIns: members read" ON public.check_ins;
CREATE POLICY "CheckIns: members read" ON public.check_ins FOR SELECT TO authenticated
  USING (public.is_movement_member(movement_id, auth.uid()));

