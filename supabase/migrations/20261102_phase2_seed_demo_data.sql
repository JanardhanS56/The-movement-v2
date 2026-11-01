-- Migration: 20261102_phase2_seed_demo_data.sql
-- The Movement: Demo auth users + public.users + movement + seed data for hackathon demo
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING throughout.

-- ============================================================
-- STEP 1: Create Demo Auth Users via Supabase Auth Admin API
-- NOTE: These are created via the seed script / Supabase dashboard.
-- This SQL file handles the *public schema* seed only.
-- Auth users must be created first via: scripts/seed-auth-users.sql
-- or via Supabase Dashboard > Authentication > Add User
-- ============================================================

-- Fixed UUIDs matching seed-data.ts exactly
-- Organizer: janardhan  → 11111111-1111-4111-8111-111111111111
-- Organizer: rohan-shetty → 22222222-2222-4222-8222-222222222222
-- Organizer: ananya-kamath → 33333333-3333-4333-8333-333333333333
-- Senior Vol: devika-pai  → 44444444-4444-4444-8444-444444444444
-- Senior Vol: karthik-bhat → 55555555-5555-4555-8555-555555555555
-- Volunteer: sneha-nayak  → 66666666-6666-4666-8666-666666666666

-- ============================================================
-- STEP 2: Seed public.users (safe upsert)
-- These rows are created by the handle_new_user() trigger when
-- auth users are created. This is a fallback direct insert.
-- ============================================================

INSERT INTO public.users (id, display_name, avatar_url, tier, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Janardhan',   'https://api.dicebear.com/7.x/shapes/svg?seed=Janardhan',    3, '2026-10-01T08:00:00Z'),
  ('22222222-2222-4222-8222-222222222222', 'Rohan Shetty', 'https://api.dicebear.com/7.x/shapes/svg?seed=RohanShetty', 3, '2026-10-01T08:30:00Z'),
  ('33333333-3333-4333-8333-333333333333', 'Ananya Kamath','https://api.dicebear.com/7.x/shapes/svg?seed=AnanyaKamath',3, '2026-10-01T09:00:00Z'),
  ('44444444-4444-4444-8444-444444444444', 'Devika Pai',   'https://api.dicebear.com/7.x/shapes/svg?seed=DevikaPai',   2, '2026-10-05T10:00:00Z'),
  ('55555555-5555-4555-8555-555555555555', 'Karthik Bhat', 'https://api.dicebear.com/7.x/shapes/svg?seed=KarthikBhat', 2, '2026-10-06T11:00:00Z'),
  ('66666666-6666-4666-8666-666666666666', 'Sneha Nayak',  'https://api.dicebear.com/7.x/shapes/svg?seed=SnehaNayak',  1, '2026-10-10T12:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url   = EXCLUDED.avatar_url,
  tier         = EXCLUDED.tier;

-- ============================================================
-- STEP 3: Seed profiles (for username-based login)
-- ============================================================

INSERT INTO public.profiles (id, username, first_name, last_name, gender, age, tier, metadata, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'janardhan',    'Janardhan',  'Organizer', 'prefer_not_to_say', 28, 'organizer',              '{"auth_email": "janardhan@demo.com",   "is_dummy_email": true}'::jsonb, '2026-10-01T08:00:00Z'),
  ('22222222-2222-4222-8222-222222222222', 'rohan-shetty', 'Rohan',      'Shetty',    'prefer_not_to_say', 32, 'organizer',              '{"auth_email": "rohan@demo.com",       "is_dummy_email": true}'::jsonb, '2026-10-01T08:30:00Z'),
  ('33333333-3333-4333-8333-333333333333', 'ananya-kamath','Ananya',     'Kamath',    'prefer_not_to_say', 30, 'organizer',              '{"auth_email": "ananya@demo.com",      "is_dummy_email": true}'::jsonb, '2026-10-01T09:00:00Z'),
  ('44444444-4444-4444-8444-444444444444', 'devika-pai',   'Devika',     'Pai',       'prefer_not_to_say', 26, 'experienced_volunteer',  '{"auth_email": "devika@demo.com",      "is_dummy_email": true}'::jsonb, '2026-10-05T10:00:00Z'),
  ('55555555-5555-4555-8555-555555555555', 'karthik-bhat', 'Karthik',    'Bhat',      'prefer_not_to_say', 24, 'experienced_volunteer',  '{"auth_email": "karthik@demo.com",     "is_dummy_email": true}'::jsonb, '2026-10-06T11:00:00Z'),
  ('66666666-6666-4666-8666-666666666666', 'sneha-nayak',  'Sneha',      'Nayak',     'prefer_not_to_say', 22, 'volunteer',              '{"auth_email": "sneha@demo.com",       "is_dummy_email": true}'::jsonb, '2026-10-10T12:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  username   = EXCLUDED.username,
  tier       = EXCLUDED.tier,
  metadata   = EXCLUDED.metadata;

-- ============================================================
-- STEP 4: Seed movement
-- ============================================================

INSERT INTO public.movements (id, name, description, slug, is_active, created_by, created_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Coastal Action Front',
  'Coordinating decentralized civic action and community support across coastal Karnataka.',
  'coastal-action-front',
  true,
  '11111111-1111-4111-8111-111111111111',
  '2026-10-01T08:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Seed movement_members
-- ============================================================

INSERT INTO public.movement_members (movement_id, user_id, role, joined_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'organizer', '2026-10-01T08:00:00Z'),
  ('00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'organizer', '2026-10-01T08:30:00Z'),
  ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'organizer', '2026-10-01T09:00:00Z'),
  ('00000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'member',    '2026-10-05T10:00:00Z'),
  ('00000000-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'member',    '2026-10-06T11:00:00Z'),
  ('00000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'member',    '2026-10-10T12:00:00Z')
ON CONFLICT (movement_id, user_id) DO NOTHING;

-- ============================================================
-- STEP 6: Seed announcements
-- ============================================================

INSERT INTO public.announcements (id, movement_id, created_by, title, body, required_signatures, is_published, published_at, created_at)
VALUES
  (
    'a1111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Assembly Point Relocation Notice',
    'Please note that the central assembly location has moved to the Town Hall premises due to space requirements. Medical and hydration tents are already stationed.',
    2, true, '2026-10-28T12:00:00Z', '2026-10-28T10:00:00Z'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Severe Weather Warning Advisory',
    'Regional meteorological alert issued for coastal zones between 14:00 and 18:00. Field stewards must verify all temporary shade structures are secured.',
    3, false, NULL, '2026-10-31T09:00:00Z'
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    '00000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'Volunteer Evening Shift Rotation',
    'Evening support shifts will transition at 17:30. Volunteers in Zone B and C must hand over check-in radios to the incoming coordinators.',
    3, false, NULL, '2026-10-31T11:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 7: Seed announcement signatures
-- ============================================================

INSERT INTO public.announcement_signatures (id, announcement_id, signed_by, signed_at)
VALUES
  ('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2026-10-28T10:00:00Z'),
  ('b2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '2026-10-28T12:00:00Z'),
  ('b3333333-3333-4333-8333-333333333333', 'a2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '2026-10-31T09:00:00Z'),
  ('b4444444-4444-4444-8444-444444444444', 'a3333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', '2026-10-31T11:00:00Z'),
  ('b5555555-5555-4555-8555-555555555555', 'a3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '2026-10-31T11:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 8: Seed tasks
-- ============================================================

INSERT INTO public.tasks (id, movement_id, created_by, title, description, reward_points, required_volunteers, status, required_skills, created_at)
VALUES
  ('c1111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Water Station Distribution Setup',
   'Set up 4 drinking water refill barrels near the main gate and ensure cups are stocked.',
   40, 2, 'open', '{}', '2026-10-25T08:00:00Z'),

  ('c2222222-2222-4222-8222-222222222222', '00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Route Navigation Signage Posting',
   'Install directional arrow signs from the bus terminal to the gathering ground.',
   50, 1, 'open', '{}', '2026-10-25T09:00:00Z'),

  ('c3333333-3333-4333-8333-333333333333', '00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Medical Supply Pack Inspection',
   'Audit first-aid packs for sterile gauze, electrolyte packets, and contact numbers.',
   60, 1, 'in_progress', '{}', '2026-10-26T10:00:00Z'),

  ('c4444444-4444-4444-8444-444444444444', '00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Information Pamphlet Distribution',
   'Distribute bilingual rights and safety cards along the northern pedestrian concourse.',
   45, 2, 'in_progress', '{}', '2026-10-27T10:00:00Z'),

  ('c5555555-5555-4555-8555-555555555555', '00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
   'Community Kitchen Dry Ration Count',
   'Complete an inventory audit of rice, lentils, and clean cooking water containers.',
   80, 1, 'pending_verification', '{}', '2026-10-28T07:30:00Z'),

  ('c6666666-6666-4666-8666-666666666666', '00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Legal Support Hotline Duty Roster',
   'Finalize lawyer contact availability sheet for the weekend coordination window.',
   100, 1, 'completed', '{}', '2026-10-20T08:00:00Z'),

  ('c8888888-8888-4888-8888-888888888888', '00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
   'Bicycle Courier Dispatch Coordination',
   'Coordinate message relays between field stewards where cellular reception is congested.',
   75, 3, 'open', '{}', '2026-10-29T11:00:00Z'),

  ('c9999999-9999-4999-8999-999999999999', '00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Eco-Friendly Waste Segregation Station',
   'Install separate compost, paper, and plastic receptacles near the main pavilion.',
   55, 1, 'open', '{}', '2026-10-30T08:00:00Z'),

  ('ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Solar Lantern Charging Array Setup',
   'Position 6 portable solar power banks on south-facing benches to charge night torches.',
   85, 2, 'open', '{}', '2026-10-31T07:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 9: Seed task_claims
-- ============================================================

INSERT INTO public.task_claims (id, task_id, claimed_by, status, note, claimed_at, completed_at, verified_at)
VALUES
  ('d3333333-3333-4333-8333-333333333333', 'c3333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
   'in_progress', 'Gathered kit boxes, currently counting bandages.', '2026-10-26T11:00:00Z', NULL, NULL),

  ('d4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444', '66666666-6666-4666-8666-666666666666',
   'in_progress', 'Picked up printed batch from center.', '2026-10-27T11:00:00Z', NULL, NULL),

  ('d5555555-5555-4555-8555-555555555555', 'c5555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555',
   'pending_verification', 'All 50 dry packs logged and verified in pantry room.', '2026-10-28T08:00:00Z', '2026-10-28T12:00:00Z', NULL),

  ('d6666666-6666-4666-8666-666666666666', 'c6666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111',
   'verified', 'Lawyer schedule cross-checked with all 8 attorneys.', '2026-10-20T09:00:00Z', '2026-10-20T14:00:00Z', '2026-10-20T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 10: Seed check_ins (a few real points for the heatmap)
-- ============================================================

INSERT INTO public.check_ins (id, movement_id, user_id, lat, lng, accuracy, checked_in_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 12.871, 74.842, 12.5, NOW() - INTERVAL '60 minutes'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 12.875, 74.845, 12.5, NOW() - INTERVAL '50 minutes'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 12.880, 74.852, 12.5, NOW() - INTERVAL '40 minutes'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 12.875, 74.845, 12.5, NOW() - INTERVAL '35 minutes'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 12.890, 74.858, 12.5, NOW() - INTERVAL '25 minutes'),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 12.875, 74.845, 12.5, NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 11: Ensure RLS is bypassed for service role (already default)
-- Verify that required tables have RLS enabled but service role bypasses
-- ============================================================

-- Grants for anon reads (public feed, tasks)
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.announcement_signatures TO anon;
GRANT SELECT ON public.tasks TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.movements TO anon;
GRANT SELECT ON public.check_ins TO anon;
