-- ============================================================
-- SEED AUTH USERS FOR HACKATHON DEMO
-- Run this in: Supabase Dashboard > SQL Editor
-- This creates the Supabase Auth users that correspond to
-- the fixed UUIDs in seed-data.ts and the public schema seed.
--
-- Demo credentials:
--   janardhan / demo1234  (Tier 3 Organizer)
--   rohan-shetty / demo1234  (Tier 3 Organizer)
--   ananya-kamath / demo1234  (Tier 3 Organizer)
--   devika-pai / demo1234  (Tier 2 Senior Volunteer)
--   karthik-bhat / demo1234  (Tier 2 Senior Volunteer)
--   sneha-nayak / demo1234  (Tier 1 Volunteer)
-- ============================================================

-- NOTE: auth.users cannot be inserted directly in most Supabase plans.
-- Use the Supabase Admin API or Dashboard to create these users.
-- Below is the equivalent using the internal admin function if available.

-- Method 1: Use Supabase Dashboard → Authentication → Add User for each:
--   Email: janardhan@demo.com    Password: demo1234   (then update UUID below)
--
-- Method 2: If you have pg_net or supabase_functions access, use the admin API.
--
-- Method 3: Direct insert (only works on self-hosted Supabase):

DO $$
BEGIN
  -- Insert Janardhan (Tier 3 Organizer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '11111111-1111-4111-8111-111111111111') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '11111111-1111-4111-8111-111111111111',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'janardhan@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "janardhan", "display_name": "Janardhan", "tier": 3, "tier_name": "organizer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;

  -- Insert Rohan Shetty (Tier 3 Organizer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '22222222-2222-4222-8222-222222222222') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '22222222-2222-4222-8222-222222222222',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'rohan@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "rohan-shetty", "display_name": "Rohan Shetty", "tier": 3, "tier_name": "organizer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;

  -- Insert Ananya Kamath (Tier 3 Organizer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '33333333-3333-4333-8333-333333333333') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '33333333-3333-4333-8333-333333333333',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'ananya@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "ananya-kamath", "display_name": "Ananya Kamath", "tier": 3, "tier_name": "organizer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;

  -- Insert Devika Pai (Tier 2 Senior Volunteer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '44444444-4444-4444-8444-444444444444') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '44444444-4444-4444-8444-444444444444',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'devika@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "devika-pai", "display_name": "Devika Pai", "tier": 2, "tier_name": "experienced_volunteer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;

  -- Insert Karthik Bhat (Tier 2 Senior Volunteer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '55555555-5555-4555-8555-555555555555') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '55555555-5555-4555-8555-555555555555',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'karthik@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "karthik-bhat", "display_name": "Karthik Bhat", "tier": 2, "tier_name": "experienced_volunteer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;

  -- Insert Sneha Nayak (Tier 1 Volunteer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '66666666-6666-4666-8666-666666666666') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '66666666-6666-4666-8666-666666666666',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'sneha@demo.com',
      crypt('demo1234', gen_salt('bf')),
      NOW(),
      '{"username": "sneha-nayak", "display_name": "Sneha Nayak", "tier": 1, "tier_name": "volunteer"}'::jsonb,
      NOW(), NOW()
    );
  END IF;
END;
$$;
