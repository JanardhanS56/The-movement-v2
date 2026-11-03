-- Migration: 20261103_phase3_ground_truth.sql
-- Description: Ground Truth public verification ledger schema, indexes, RLS, and seed data.

-- 1. Create ground_truth_commits table
CREATE TABLE IF NOT EXISTS public.ground_truth_commits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  commit_hash VARCHAR(20) NOT NULL UNIQUE,
  full_sha256 VARCHAR(64) NOT NULL,
  parent_hash VARCHAR(64) NOT NULL DEFAULT '#0000000',
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('task_completed', 'announcement', 'emergency_alert')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT DEFAULT '',
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast lookup & filtering
CREATE INDEX IF NOT EXISTS idx_ground_truth_event_type ON public.ground_truth_commits(event_type);
CREATE INDEX IF NOT EXISTS idx_ground_truth_commit_hash ON public.ground_truth_commits(commit_hash);
CREATE INDEX IF NOT EXISTS idx_ground_truth_created_at ON public.ground_truth_commits(created_at DESC);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.ground_truth_commits ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all transparency ledger commits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ground_truth_commits' AND policyname = 'public_read_ground_truth'
  ) THEN
    CREATE POLICY public_read_ground_truth ON public.ground_truth_commits
      FOR SELECT USING (true);
  END IF;
END $$;

-- Allow authenticated users or service role to insert verified commits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ground_truth_commits' AND policyname = 'authenticated_insert_ground_truth'
  ) THEN
    CREATE POLICY authenticated_insert_ground_truth ON public.ground_truth_commits
      FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- 4. Seed initial Ground Truth verifiable commits (idempotent ON CONFLICT)
INSERT INTO public.ground_truth_commits (
  id, commit_hash, full_sha256, parent_hash, event_type, title, summary, details,
  author_id, author_snapshot, proof, tags, metadata, created_at
)
VALUES
  (
    'gt-commit-012',
    '#d1928ec',
    'd1928ec7f5b401e9a24c81f03bb91a5e78cd01b3e8a491f2c4e610b7194f280a',
    '#0f7b62a',
    'announcement',
    'Summary of Demands Formal Presentation',
    'Citizen assembly memorandum officially submitted to the Municipal Commissioner with signed endorsement of 4,200 participants.',
    'The 8-point resolution regarding clean water access, transparent local budgets, and coastal ecology preservation was presented at Town Hall with full quorum. Official acknowledgement receipt #KA-MNG-2026-992 signed.',
    '11111111-1111-4111-8111-111111111111',
    '{"id": "11111111-1111-4111-8111-111111111111", "name": "Janardhan", "handle": "janardhan", "tier": 3, "roleTitle": "Movement Organizer", "avatarUrl": "https://api.dicebear.com/7.x/shapes/svg?seed=Janardhan"}'::jsonb,
    '{"algorithm": "Ed25519-SHA512", "signatureHex": "b9c71a04e5d891b2c7e0912f7a4b81c30e9d4128f1b620a9e4d7159c3e80b2a7", "publicKeyFingerprint": "SHA256:4a8b...19e0", "verified": true, "blockNumber": 12, "merkleRoot": "7fa1...99bc", "parentHash": "#0f7b62a"}'::jsonb,
    ARRAY['Demands', 'Municipal', 'Memorandum'],
    '{"location": "Town Hall Premises, Mangalore", "signaturesVerified": 3, "signaturesRequired": 3, "sector": "Main Civic Complex"}'::jsonb,
    '2026-11-01T10:00:00Z'
  ),
  (
    'gt-commit-011',
    '#0f7b62a',
    '0f7b62a98e10d4c51b72a08f3e91c4b75a28cd19e04f618b2a3d7194f8019ab3',
    '#4c910fb',
    'task_completed',
    'Post-Assembly Site Clean-Up & Recycling',
    'Collected and segregated 45 waste bags; zero litter left on public park grounds; recyclables transferred to municipal partner.',
    '18 volunteer teams swept the gathering grounds from 17:00 to 19:00. 100% of organic waste and paper placards were sorted. Public ground restored to pristine condition.',
    '66666666-6666-4666-8666-666666666666',
    '{"id": "66666666-6666-4666-8666-666666666666", "name": "Arjun Rao", "handle": "arjun-rao", "tier": 1, "roleTitle": "Active Volunteer", "avatarUrl": "https://api.dicebear.com/7.x/shapes/svg?seed=ArjunRao"}'::jsonb,
    '{"algorithm": "Ed25519-SHA512", "signatureHex": "82a17f09c4d8e12b70f391a84b5c62d0e719a84b2c159e4d708f3e91b2c6a084", "publicKeyFingerprint": "SHA256:8b1f...55c2", "verified": true, "blockNumber": 11, "merkleRoot": "c18e...20fd", "parentHash": "#4c910fb"}'::jsonb,
    ARRAY['Environment', 'Clean-up', 'Civic Stewardship'],
    '{"location": "Town Hall Public Grounds", "impactPointsAwarded": 75, "verificationType": "Peer consensus (4 verified)", "sector": "Sector 1 & 2 Grounds"}'::jsonb,
    '2026-10-31T19:00:00Z'
  ),
  (
    'gt-commit-010',
    '#4c910fb',
    '4c910fb82a19e07f3d61b58a9c4e20d871b9c3f0e5a82194b6d701c9a83e5f20',
    '#8a2d3e1',
    'emergency_alert',
    'Supply Delivery Delay Advisory',
    'Secondary medical supply truck delayed by 30 mins due to perimeter traffic. Temporary rationing in effect at South Gate.',
    'Perimeter route congestion along National Highway 66 delayed replenishment vehicle. Bandages and electrolyte sachets pooled from Zone A cache to maintain uninterrupted field care.',
    '44444444-4444-4444-8444-444444444444',
    '{"id": "44444444-4444-4444-8444-444444444444", "name": "Devika Pai", "handle": "devika-pai", "tier": 2, "roleTitle": "Senior Field Steward", "avatarUrl": "https://api.dicebear.com/7.x/shapes/svg?seed=DevikaPai"}'::jsonb,
    '{"algorithm": "Ed25519-SHA512", "signatureHex": "39a08f71b2c6e4d58019f2a74c8b91d30e5f62a98b1c4e7d018f29c3a8b4e710", "publicKeyFingerprint": "SHA256:19e0...77ab", "verified": true, "blockNumber": 10, "merkleRoot": "5e20...11da", "parentHash": "#8a2d3e1"}'::jsonb,
    ARRAY['Logistics', 'Emergency', 'Medical Supply'],
    '{"location": "South Gate Triage Depot", "sector": "Zone B Triage", "signaturesVerified": 1, "signaturesRequired": 1}'::jsonb,
    '2026-10-31T11:40:00Z'
  ),
  (
    'gt-commit-009',
    '#8a2d3e1',
    '8a2d3e170f92b4c581e091a4b6c82d70e3f591a82c4b71d9e08f2a93b5c61840',
    '#b5192fa',
    'task_completed',
    'Acoustic & Sound Equipment Setup',
    'Installed battery-powered PA systems across 3 relay points ensuring clear public address coverage without main grid dependency.',
    'Deployed independent high-clarity megaphone towers at Central Circle, West Plaza, and South Entrance. Decibel test verified within municipal 75dB compliance boundaries.',
    '55555555-5555-4555-8555-555555555555',
    '{"id": "55555555-5555-4555-8555-555555555555", "name": "Karthik Bhat", "handle": "karthik-bhat", "tier": 2, "roleTitle": "Field Coordinator", "avatarUrl": "https://api.dicebear.com/7.x/shapes/svg?seed=KarthikBhat"}'::jsonb,
    '{"algorithm": "Ed25519-SHA512", "signatureHex": "71e09a82b4c581f390d2a74c8b61e0d98f3a5b2c149e7d082f1b62a98c4e09f5", "publicKeyFingerprint": "SHA256:22bb...88d1", "verified": true, "blockNumber": 9, "merkleRoot": "99aa...33cc", "parentHash": "#b5192fa"}'::jsonb,
    ARRAY['Infrastructure', 'Audio', 'Public Safety'],
    '{"location": "Central Circle & Relay Posts", "impactPointsAwarded": 80, "verificationType": "Organizer Verification (Verified by Janardhan)", "sector": "Sector 1 Audio Post"}'::jsonb,
    '2026-10-31T08:15:00Z'
  ),
  (
    'gt-commit-008',
    '#b5192fa',
    'b5192fa8109d7c4b5e28a901f4c63d871a9e20b5f8c47190e2b3a841d9e05f62',
    '#98e01d3',
    'announcement',
    'Volunteer Evening Shift Rotation Handover',
    'Shift transition active. Volunteers in Zone B and C handed over check-in radios and battery packs to incoming coordinators.',
    'Night protocol activated. Safety marshals in pairs of two will maintain visibility along lighted transit corridors until 21:00. Rest station open at Community Center.',
    '22222222-2222-4222-8222-222222222222',
    '{"id": "22222222-2222-4222-8222-222222222222", "name": "Rohan Shetty", "handle": "rohan-shetty", "tier": 3, "roleTitle": "Movement Organizer", "avatarUrl": "https://api.dicebear.com/7.x/shapes/svg?seed=RohanShetty"}'::jsonb,
    '{"algorithm": "Ed25519-SHA512", "signatureHex": "14f092b7a8c5e1d908f2a74b3c61d8e09f5a82b1c4e97d028f1a62c98b4e70f1", "publicKeyFingerprint": "SHA256:55cc...99ef", "verified": true, "blockNumber": 8, "merkleRoot": "0a1b...88fe", "parentHash": "#98e01d3"}'::jsonb,
    ARRAY['Handover', 'Shifts', 'Safety Protocol'],
    '{"location": "Zone B & C Coordinator Desk", "signaturesVerified": 2, "signaturesRequired": 2, "sector": "Sector 2 West"}'::jsonb,
    '2026-10-30T17:30:00Z'
  )
ON CONFLICT (commit_hash) DO NOTHING;

