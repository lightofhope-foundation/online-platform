-- Phase 3.1: access levels, per-level unlock defaults, registration field definitions (LOH only)
-- Project: tovojkwejkoysgygogfl

-- ---------------------------------------------------------------------------
-- Client access level (Stufe 0–5)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_level int NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_access_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_access_level_check
  CHECK (access_level >= 0 AND access_level <= 5);

-- ---------------------------------------------------------------------------
-- Per-level unlock defaults (falls back to global when no row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_unlock_defaults_by_level (
  access_level int PRIMARY KEY CHECK (access_level >= 0 AND access_level <= 5),
  first_gated_video_position int NOT NULL DEFAULT 4 CHECK (first_gated_video_position >= 1),
  first_unlock_offset_days int NOT NULL DEFAULT 7 CHECK (first_unlock_offset_days >= 0),
  subsequent_unlock_interval_days int NOT NULL DEFAULT 3 CHECK (subsequent_unlock_interval_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id)
);

-- ---------------------------------------------------------------------------
-- Registration field definitions (admin-managed; instant add/edit/delete)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS registration_field_definitions_field_key_active_unique
  ON public.registration_field_definitions (field_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS registration_field_definitions_active_idx
  ON public.registration_field_definitions (sort_order)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Per-user answers for custom registration fields
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_registration_values (
  user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.registration_field_definitions (id) ON DELETE CASCADE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, field_id)
);

CREATE INDEX IF NOT EXISTS profile_registration_values_field_id_idx
  ON public.profile_registration_values (field_id);

-- Seed built-in field definitions (map to profiles columns in UI later)
INSERT INTO public.registration_field_definitions (
  field_key, label, required, sort_order, is_system
)
SELECT v.field_key, v.label, v.required, v.sort_order, true
FROM (
  VALUES
    ('first_name', 'Vorname', true, 10),
    ('last_name', 'Nachname', true, 20),
    ('date_of_birth', 'Geburtsdatum', false, 30),
    ('street', 'Straße', false, 40),
    ('house_number', 'Hausnummer', false, 50)
) AS v (field_key, label, required, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.registration_field_definitions d
  WHERE d.field_key = v.field_key AND d.deleted_at IS NULL
);

-- ---------------------------------------------------------------------------
-- Resolve unlock defaults: level row → global singleton
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_unlock_defaults_for_user (p_user_id uuid)
RETURNS TABLE (
  first_gated_video_position int,
  first_unlock_offset_days int,
  subsequent_unlock_interval_days int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(l.first_gated_video_position, g.first_gated_video_position),
    coalesce(l.first_unlock_offset_days, g.first_unlock_offset_days),
    coalesce(l.subsequent_unlock_interval_days, g.subsequent_unlock_interval_days)
  FROM public.profiles p
  LEFT JOIN public.platform_unlock_defaults_by_level l
    ON l.access_level = coalesce(p.access_level, 0)
  CROSS JOIN (
    SELECT *
    FROM public.platform_unlock_defaults
    ORDER BY updated_at DESC
    LIMIT 1
  ) g
  WHERE p.user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Seed schedule for one user (level → global; keeps manual rows)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_user_video_unlocks (p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg timestamptz;
  v_first_gated int;
  v_first_offset int;
  v_interval int;
  v_count int := 0;
  rec record;
  v_unlock timestamptz;
  v_extra_days int;
  v_reg_date date;
BEGIN
  SELECT created_at INTO v_reg FROM public.profiles WHERE user_id = p_user_id;
  IF v_reg IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  SELECT
    d.first_gated_video_position,
    d.first_unlock_offset_days,
    d.subsequent_unlock_interval_days
  INTO v_first_gated, v_first_offset, v_interval
  FROM public.resolve_unlock_defaults_for_user (p_user_id) AS d;

  IF v_first_gated IS NULL THEN
    RAISE EXCEPTION 'platform_unlock_defaults not configured';
  END IF;

  v_reg_date := (v_reg AT TIME ZONE 'Europe/Berlin')::date;

  DELETE FROM public.user_video_unlocks
  WHERE user_id = p_user_id AND source = 'default';

  FOR rec IN SELECT * FROM public.get_published_videos_ordered () LOOP
    IF rec.global_position >= v_first_gated THEN
      v_extra_days := (rec.global_position - v_first_gated) * v_interval;
      v_unlock := ((v_reg_date + (v_first_offset + v_extra_days))::timestamp + time '10:00')
        AT TIME ZONE 'Europe/Berlin';

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

-- Bulk re-seed all clients (Phase 3.4 UI; function ready in 3.1)
CREATE OR REPLACE FUNCTION public.seed_all_clients_video_unlocks ()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int := 0;
  r record;
BEGIN
  FOR r IN
    SELECT user_id FROM public.profiles WHERE role = 'client'
  LOOP
    v_total := v_total + public.seed_user_video_unlocks (r.user_id);
  END LOOP;
  RETURN v_total;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.platform_unlock_defaults_by_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_registration_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pud_level_select_authenticated ON public.platform_unlock_defaults_by_level;
CREATE POLICY pud_level_select_authenticated ON public.platform_unlock_defaults_by_level
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS rfd_select_active ON public.registration_field_definitions;
CREATE POLICY rfd_select_active ON public.registration_field_definitions
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS prv_select_own ON public.profile_registration_values;
CREATE POLICY prv_select_own ON public.profile_registration_values
  FOR SELECT TO authenticated
  USING (auth.uid () = user_id);

DROP POLICY IF EXISTS prv_insert_own ON public.profile_registration_values;
CREATE POLICY prv_insert_own ON public.profile_registration_values
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS prv_update_own ON public.profile_registration_values;
CREATE POLICY prv_update_own ON public.profile_registration_values
  FOR UPDATE TO authenticated
  USING (auth.uid () = user_id)
  WITH CHECK (auth.uid () = user_id);
