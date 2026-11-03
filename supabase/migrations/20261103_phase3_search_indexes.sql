-- ============================================================================
-- Migration: 20261103_phase3_search_indexes.sql
-- Checkpoint 6.1: Full-Text GIN Search Indexes on Tasks & Announcements
-- Safe to re-run: Uses IF NOT EXISTS and immutable expressions.
-- ============================================================================

-- 1. Full-text search GIN index on tasks (title + description)
CREATE INDEX IF NOT EXISTS idx_tasks_search_gin
ON public.tasks
USING gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- 2. Full-text search GIN index on announcements (title + body)
CREATE INDEX IF NOT EXISTS idx_announcements_search_gin
ON public.announcements
USING gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
);

-- 3. Temporal cursor pagination composite indexes
CREATE INDEX IF NOT EXISTS idx_tasks_movement_created_at
ON public.tasks (movement_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_movement_published_at
ON public.announcements (movement_id, published_at DESC, created_at DESC);
