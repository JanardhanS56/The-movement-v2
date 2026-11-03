-- ============================================================================
-- Migration: 20261103_phase3_storage_buckets.sql
-- Checkpoint 5.1: Storage Buckets and RLS Policies for Proofs and Avatars
-- Safe to re-run: Uses ON CONFLICT and DROP POLICY IF EXISTS.
-- ============================================================================

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'task-proofs',
    'task-proofs',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS Policies on storage.objects for task-proofs
DROP POLICY IF EXISTS "TaskProofs: Public Read Access" ON storage.objects;
CREATE POLICY "TaskProofs: Public Read Access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'task-proofs');

DROP POLICY IF EXISTS "TaskProofs: Volunteer Upload" ON storage.objects;
CREATE POLICY "TaskProofs: Volunteer Upload"
  ON storage.objects FOR INSERT
  TO authenticated, anon
  WITH CHECK (bucket_id = 'task-proofs');

-- 3. RLS Policies on storage.objects for avatars
DROP POLICY IF EXISTS "Avatars: Public Read Access" ON storage.objects;
CREATE POLICY "Avatars: Public Read Access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars: User Upload" ON storage.objects;
CREATE POLICY "Avatars: User Upload"
  ON storage.objects FOR INSERT
  TO authenticated, anon
  WITH CHECK (bucket_id = 'avatars');
