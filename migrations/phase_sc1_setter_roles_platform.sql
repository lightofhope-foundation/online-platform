-- Phase SC1: Setter & Closer role, multi-role, therapy session config, booking links, intake
-- Enum values: see phase_sc1_user_role_enum.sql (must commit before this file)

CREATE TABLE IF NOT EXISTS public.profile_extra_roles (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role),
  CONSTRAINT profile_extra_roles_allowed CHECK (
    role IN ('therapist', 'setter_closer', 'teamlead')
  )
);

ALTER TABLE public.profile_extra_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_therapy_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  standard_session_count integer NOT NULL DEFAULT 18 CHECK (standard_session_count BETWEEN 1 AND 99),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id)
);

INSERT INTO public.platform_therapy_config (id, standard_session_count)
VALUES (1, 18)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS zoom_meeting_url text,
  ADD COLUMN IF NOT EXISTS calendly_url text;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS intake_data jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.therapy_sessions
  DROP CONSTRAINT IF EXISTS therapy_sessions_session_number_check;

ALTER TABLE public.therapy_sessions
  ADD CONSTRAINT therapy_sessions_session_number_check
  CHECK (
    (is_special = true AND session_number >= 1001)
    OR (is_special = false AND session_number >= 1 AND session_number <= 99)
  );

CREATE OR REPLACE FUNCTION public.user_has_role(p_uid uuid, p_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = p_uid AND p.role = p_role
  )
  OR EXISTS (
    SELECT 1 FROM public.profile_extra_roles r
    WHERE r.user_id = p_uid AND r.role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_setter_closer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_role(auth.uid(), 'setter_closer'::public.user_role)
     OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_standard_session_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT standard_session_count FROM public.platform_therapy_config WHERE id = 1),
    18
  );
$$;

COMMENT ON TABLE public.profile_extra_roles IS 'Additional portal roles (e.g. therapist + setter_closer)';
COMMENT ON TABLE public.platform_therapy_config IS 'Singleton — standard therapy session count per client';
COMMENT ON COLUMN public.clients.intake_data IS 'Setter/Closer intake (Milanote replacement) — JSON sections';
