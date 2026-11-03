-- Migration: 20261103_phase3_movement_invite_codes.sql
-- Description: Adds 5-character alphanumeric invite codes and auto-generator for movements.

-- 1. Add invite_code column
ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(5) UNIQUE;

-- 2. Generator function using unambiguous uppercase characters (no 0/O, 1/I)
CREATE OR REPLACE FUNCTION generate_movement_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Trigger to auto-generate invite_code on INSERT if omitted
CREATE OR REPLACE FUNCTION trg_set_movement_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  collision_count INTEGER := 0;
BEGIN
  IF NEW.invite_code IS NULL OR trim(NEW.invite_code) = '' THEN
    LOOP
      new_code := generate_movement_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.movements WHERE invite_code = new_code);
      collision_count := collision_count + 1;
      IF collision_count > 100 THEN
        RAISE EXCEPTION 'Failed to generate unique movement invite code after 100 attempts';
      END IF;
    END LOOP;
    NEW.invite_code := new_code;
  ELSE
    NEW.invite_code := upper(trim(NEW.invite_code));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movements_invite_code ON public.movements;
CREATE TRIGGER trg_movements_invite_code
BEFORE INSERT ON public.movements
FOR EACH ROW
EXECUTE FUNCTION trg_set_movement_invite_code();

-- 4. Backfill existing movements with unambiguous codes
UPDATE public.movements
SET invite_code = 'MOV9K'
WHERE (id = '00000000-0000-4000-8000-000000000001' OR slug = 'the-movement')
  AND (invite_code IS NULL OR invite_code = '');

UPDATE public.movements
SET invite_code = generate_movement_invite_code()
WHERE invite_code IS NULL OR invite_code = '';

-- 5. Index for fast lookup by invite code
CREATE INDEX IF NOT EXISTS idx_movements_invite_code ON public.movements(invite_code);

-- 6. Ensure movement membership insertion policy allows volunteers to join
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movement_members' AND policyname = 'allow_authenticated_join'
  ) THEN
    CREATE POLICY allow_authenticated_join ON public.movement_members
      FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR auth.role() = 'authenticated'
      );
  END IF;
END $$;

