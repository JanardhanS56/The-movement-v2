-- Migration: 20261101_phase1_profiles_and_logs.sql
-- The Movement: Profiles, Session Logs, and Task Required Skills

-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT UNIQUE NOT NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  gender            TEXT NOT NULL,
  age               INTEGER NOT NULL CHECK (age >= 14),
  skills_interests  TEXT[] NOT NULL DEFAULT '{}',
  phone             TEXT,
  tier              TEXT NOT NULL CHECK (tier IN ('volunteer', 'experienced_volunteer', 'organizer')),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create user_logs table for audit and session tracking
CREATE TABLE IF NOT EXISTS public.user_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action            TEXT NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3. Add required_skills column to tasks table if not present
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] NOT NULL DEFAULT '{}';

-- 4. Create GIN and lookup indexes for performance and array overlap (Smart Assign)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN (skills_interests);
CREATE INDEX IF NOT EXISTS idx_tasks_required_skills ON public.tasks USING GIN (required_skills);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_time ON public.user_logs(user_id, timestamp DESC);

-- 5. Keep legacy public.users synchronized with public.profiles
CREATE OR REPLACE FUNCTION public.sync_profile_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_num SMALLINT;
BEGIN
  IF NEW.tier = 'organizer' THEN
    v_tier_num := 3;
  ELSIF NEW.tier = 'experienced_volunteer' THEN
    v_tier_num := 2;
  ELSE
    v_tier_num := 1;
  END IF;

  INSERT INTO public.users (id, display_name, tier, updated_at)
  VALUES (
    NEW.id,
    TRIM(NEW.first_name || ' ' || NEW.last_name),
    v_tier_num,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = TRIM(EXCLUDED.display_name),
    tier = EXCLUDED.tier,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_synced ON public.profiles;
CREATE TRIGGER on_profile_synced
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_users();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- profiles RLS policies
DROP POLICY IF EXISTS "Profiles: public read" ON public.profiles;
CREATE POLICY "Profiles: public read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles: self insert" ON public.profiles;
CREATE POLICY "Profiles: self insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Profiles: self update" ON public.profiles;
CREATE POLICY "Profiles: self update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_logs RLS policies
DROP POLICY IF EXISTS "UserLogs: self insert" ON public.user_logs;
CREATE POLICY "UserLogs: self insert" ON public.user_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "UserLogs: self read" ON public.user_logs;
CREATE POLICY "UserLogs: self read" ON public.user_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Add check_ins table to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Publication might not exist in local/mock environments
END;
$$;

-- 8. Robust handle_new_user() handling both numeric (1, 2, 3) and string ('volunteer', 'experienced_volunteer', 'organizer') tiers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_raw TEXT;
  v_tier_num SMALLINT := 1;
BEGIN
  v_tier_raw := NEW.raw_user_meta_data->>'tier';
  
  IF v_tier_raw = 'organizer' OR v_tier_raw = '3' THEN
    v_tier_num := 3;
  ELSIF v_tier_raw = 'experienced_volunteer' OR v_tier_raw = '2' THEN
    v_tier_num := 2;
  ELSE
    v_tier_num := 1;
  END IF;

  INSERT INTO public.users (id, display_name, avatar_url, tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_tier_num
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

