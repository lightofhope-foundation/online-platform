-- Phase 1: unlock scheduling + profile fields + client_id allocation (LOH Supabase only)
-- Project: tovojkwejkoysgygogfl

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.unlock_schedule_source AS ENUM ('default', 'manual', 'override');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Platform defaults (singleton row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_unlock_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_gated_video_position int NOT NULL DEFAULT 4 CHECK (first_gated_video_position >= 1),
  first_unlock_offset_days int NOT NULL DEFAULT 7 CHECK (first_unlock_offset_days >= 0),
  subsequent_unlock_interval_days int NOT NULL DEFAULT 3 CHECK (subsequent_unlock_interval_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id)
);

INSERT INTO public.platform_unlock_defaults (
  first_gated_video_position,
  first_unlock_offset_days,
  subsequent_unlock_interval_days
)
SELECT 4, 7, 3
WHERE NOT EXISTS (SELECT 1 FROM public.platform_unlock_defaults);

-- ---------------------------------------------------------------------------
-- Per-user per-video schedule (videos 4+ by default)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_video_unlocks (
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  global_position int NOT NULL CHECK (global_position >= 1),
  unlock_at timestamptz NOT NULL,
  source public.unlock_schedule_source NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS user_video_unlocks_user_id_idx ON public.user_video_unlocks (user_id);
CREATE INDEX IF NOT EXISTS user_video_unlocks_unlock_at_idx ON public.user_video_unlocks (unlock_at);

-- ---------------------------------------------------------------------------
-- Profile fields (settings / admin info tile)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS house_number text;

-- ---------------------------------------------------------------------------
-- Published videos in global order (chapter.position, video.position)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_published_videos_ordered ()
RETURNS TABLE (video_id uuid, global_position int)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    v.id AS video_id,
    ROW_NUMBER() OVER (
      ORDER BY ch.position ASC, v.position ASC
    )::int AS global_position
  FROM public.videos v
  JOIN public.chapters ch ON ch.id = v.chapter_id AND ch.deleted_at IS NULL
  JOIN public.courses c ON c.id = ch.course_id AND c.deleted_at IS NULL AND c.published = true
  WHERE v.deleted_at IS NULL;
$$;

-- ---------------------------------------------------------------------------
-- Allocate next Nutzer-ID (client_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_next_client_id (
  p_first_name text,
  p_last_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch int;
  v_seq int;
  v_new_batch int;
  v_new_seq int;
  v_first text;
  v_last text;
BEGIN
  v_first := lower(substring(regexp_replace(coalesce(trim(p_first_name), ''), '[^a-zA-ZäöüßÄÖÜ]', '', 'g') FROM 1 FOR 2));
  v_last := lower(substring(regexp_replace(coalesce(trim(p_last_name), ''), '[^a-zA-ZäöüßÄÖÜ]', '', 'g') FROM 1 FOR 2));
  IF v_first = '' OR v_first IS NULL THEN
    v_first := 'xx';
  ELSIF char_length(v_first) < 2 THEN
    v_first := rpad(v_first, 2, 'x');
  END IF;
  IF v_last = '' OR v_last IS NULL THEN
    v_last := 'xx';
  ELSIF char_length(v_last) < 2 THEN
    v_last := rpad(v_last, 2, 'x');
  END IF;

  UPDATE public.client_id_counter
  SET
    seq_num = CASE WHEN seq_num >= 999 THEN 1 ELSE seq_num + 1 END,
    batch_num = CASE WHEN seq_num >= 999 THEN batch_num + 1 ELSE batch_num END,
    updated_at = now()
  WHERE id = 1
  RETURNING batch_num, seq_num INTO v_new_batch, v_new_seq;

  IF NOT FOUND THEN
    INSERT INTO public.client_id_counter (id, batch_num, seq_num) VALUES (1, 1, 1)
    RETURNING batch_num, seq_num INTO v_new_batch, v_new_seq;
  END IF;

  RETURN lower(
    lpad(v_new_batch::text, 2, '0') || v_first || v_last || lpad(v_new_seq::text, 3, '0')
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Seed schedule for one user (registration = profiles.created_at, Europe/Berlin)
-- Videos 1..(N-1): no row → schedule gate open
-- Video N+: unlock_at = reg + first_offset + (pos - N) * interval
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_user_video_unlocks (p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg timestamptz;
  v_defaults public.platform_unlock_defaults%ROWTYPE;
  v_count int := 0;
  rec record;
  v_unlock timestamptz;
  v_extra_days int;
BEGIN
  SELECT created_at INTO v_reg FROM public.profiles WHERE user_id = p_user_id;
  IF v_reg IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  SELECT * INTO v_defaults FROM public.platform_unlock_defaults ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'platform_unlock_defaults not configured';
  END IF;

  DELETE FROM public.user_video_unlocks
  WHERE user_id = p_user_id AND source = 'default';

  FOR rec IN SELECT * FROM public.get_published_videos_ordered () LOOP
    IF rec.global_position >= v_defaults.first_gated_video_position THEN
      v_extra_days := (rec.global_position - v_defaults.first_gated_video_position)
        * v_defaults.subsequent_unlock_interval_days;
      v_unlock := v_reg
        + make_interval(days => v_defaults.first_unlock_offset_days + v_extra_days);

      INSERT INTO public.user_video_unlocks (
        user_id, video_id, global_position, unlock_at, source
      )
      VALUES (p_user_id, rec.video_id, rec.global_position, v_unlock, 'default');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: auto client_id + seed unlocks for new clients
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_before_insert_client ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'client' AND NEW.client_id IS NULL THEN
    NEW.client_id := public.allocate_next_client_id(NEW.first_name, NEW.last_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_after_insert_seed_unlocks ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'client' THEN
    PERFORM public.seed_user_video_unlocks(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_before_insert_client_id ON public.profiles;
CREATE TRIGGER profiles_before_insert_client_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_before_insert_client ();

DROP TRIGGER IF EXISTS profiles_after_insert_seed_unlocks ON public.profiles;
CREATE TRIGGER profiles_after_insert_seed_unlocks
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_after_insert_seed_unlocks ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_video_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_unlock_defaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS uvu_select_own ON public.user_video_unlocks;
CREATE POLICY uvu_select_own ON public.user_video_unlocks
  FOR SELECT TO authenticated
  USING (auth.uid () = user_id);

DROP POLICY IF EXISTS pud_select_authenticated ON public.platform_unlock_defaults;
CREATE POLICY pud_select_authenticated ON public.platform_unlock_defaults
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Backfill existing client(s)
-- ---------------------------------------------------------------------------
SELECT public.seed_user_video_unlocks ('a5e1174d-4e4a-4170-85a7-baa4519e3a21');
