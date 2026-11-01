-- Migration: 20261102_phase2_users_handle_and_prefs.sql
-- Adds optional handle (maps to profiles.username) and leaderboard preference to public.users

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS handle TEXT,
  ADD COLUMN IF NOT EXISTS show_on_leaderboards BOOLEAN NOT NULL DEFAULT true;

-- Unique constraint on handle (sparse — only non-null values are unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON public.users(handle) WHERE handle IS NOT NULL;

-- Back-fill handles from profiles table
UPDATE public.users u
SET handle = p.username
FROM public.profiles p
WHERE p.id = u.id AND u.handle IS NULL;

-- Also keep RLS: users can update their own handle
DROP POLICY IF EXISTS "Users: self update handle" ON public.users;
CREATE POLICY "Users: self update handle" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to auto-set handle from profile on profile upsert
CREATE OR REPLACE FUNCTION public.sync_handle_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET handle = NEW.username,
      updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_handle_sync ON public.profiles;
CREATE TRIGGER on_profile_handle_sync
  AFTER INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_handle_from_profile();
