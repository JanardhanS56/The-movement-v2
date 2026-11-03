-- Migration: 20261103_phase3_chat_tables.sql
-- Description: Creates persistent chat rooms, messages, reactions, reports, and pinned messages schema with RLS.

-- 1. chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id                  TEXT PRIMARY KEY,
  movement_id         UUID REFERENCES public.movements(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  slow_mode_seconds   INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  status      TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'failed', 'removed')),
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  mentions    UUID[] NOT NULL DEFAULT '{}',
  reactions   JSONB NOT NULL DEFAULT '{}'::jsonb,
  task_ref    UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. chat_reactions table
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_key  TEXT NOT NULL CHECK (reaction_key IN ('thumbs_up', 'heart', 'thanks', 'celebrate', 'laugh', 'surprised')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, reaction_key)
);

-- 4. chat_reports table
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('harassment', 'spam', 'private_information', 'dangerous_content', 'other')),
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. chat_pinned_messages table
CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
  room_id     TEXT PRIMARY KEY REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id  UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  pinned_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  pinned_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes for real-time querying & pagination
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author ON public.chat_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON public.chat_reports(status);

-- 7. Row-Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Read policies: public transparency
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'public_read_chat_rooms') THEN
    CREATE POLICY public_read_chat_rooms ON public.chat_rooms FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'public_read_chat_messages') THEN
    CREATE POLICY public_read_chat_messages ON public.chat_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_reactions' AND policyname = 'public_read_chat_reactions') THEN
    CREATE POLICY public_read_chat_reactions ON public.chat_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_pinned_messages' AND policyname = 'public_read_chat_pinned') THEN
    CREATE POLICY public_read_chat_pinned ON public.chat_pinned_messages FOR SELECT USING (true);
  END IF;
END $$;

-- Write policies: authenticated users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'auth_insert_chat_messages') THEN
    CREATE POLICY auth_insert_chat_messages ON public.chat_messages FOR INSERT
      WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_reactions' AND policyname = 'auth_insert_chat_reactions') THEN
    CREATE POLICY auth_insert_chat_reactions ON public.chat_reactions FOR ALL
      USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_reports' AND policyname = 'auth_insert_chat_reports') THEN
    CREATE POLICY auth_insert_chat_reports ON public.chat_reports FOR INSERT
      WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_pinned_messages' AND policyname = 'auth_manage_chat_pinned') THEN
    CREATE POLICY auth_manage_chat_pinned ON public.chat_pinned_messages FOR ALL
      USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  END IF;
END $$;

-- 8. Seed Default Rooms
INSERT INTO public.chat_rooms (id, name, description, slow_mode_seconds)
VALUES
  ('everyone', 'Everyone', 'Movement-wide discussion and general updates', 0),
  ('coastal-action-front', 'Coastal Action Front', 'Field coordination and coastal cleanup actions', 0),
  ('help-questions', 'Help and questions', 'Ask fellow volunteers or organizers for guidance', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 9. Seed Initial Discussion Messages
INSERT INTO public.chat_messages (id, room_id, author_id, text, status, reactions, created_at)
VALUES
  (
    'a1111111-0001-4000-8000-000000000001',
    'everyone',
    '11111111-1111-4111-8111-111111111111',
    'Welcome everyone to The Movement chat. Please keep conversations constructive and helpful.',
    'sent',
    '{"thumbs_up": ["22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"]}'::jsonb,
    now() - interval '14 hours'
  ),
  (
    'a1111111-0001-4000-8000-000000000002',
    'everyone',
    '22222222-2222-4222-8222-222222222222',
    'Reminder: Check the tasks tab for open bounites and volunteer spots needed today.',
    'sent',
    '{"heart": ["11111111-1111-4111-8111-111111111111"]}'::jsonb,
    now() - interval '10 hours'
  ),
  (
    'a1111111-0001-4000-8000-000000000003',
    'help-questions',
    '44444444-4444-4444-8444-444444444444',
    'Where should volunteers report for the evening hydration station task?',
    'sent',
    '{}'::jsonb,
    now() - interval '6 hours'
  ),
  (
    'a1111111-0001-4000-8000-000000000004',
    'help-questions',
    '11111111-1111-4111-8111-111111111111',
    'Central Circle near Gate 2. Field stewards will be wearing cobalt badges.',
    'sent',
    '{"thanks": ["44444444-4444-4444-8444-444444444444"]}'::jsonb,
    now() - interval '5 hours'
  )
ON CONFLICT (id) DO NOTHING;
