-- Phase 3.6: one-time registration invite code (singleton) + rotate on signup

CREATE TABLE IF NOT EXISTS public.platform_registration_invite (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_code text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_rotated_at timestamptz,
  rotated_by uuid REFERENCES auth.users (id)
);

ALTER TABLE public.platform_registration_invite ENABLE ROW LEVEL SECURITY;

-- No policies: only service role / SECURITY DEFINER functions access this table.

CREATE OR REPLACE FUNCTION public.generate_registration_invite_code ()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c1 text := '';
  c2 text := '';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    c1 := c1 || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    c2 := c2 || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN c1 || '-' || c2;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_registration_invite_row ()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT current_code INTO v_code FROM public.platform_registration_invite WHERE id = 1;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  v_code := public.generate_registration_invite_code();
  INSERT INTO public.platform_registration_invite (id, current_code, last_rotated_at)
  VALUES (1, v_code, now());
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_registration_invite_code (p_actor_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := public.generate_registration_invite_code();
  INSERT INTO public.platform_registration_invite (id, current_code, updated_at, last_rotated_at, rotated_by)
  VALUES (1, v_code, now(), now(), p_actor_id)
  ON CONFLICT (id) DO UPDATE SET
    current_code = EXCLUDED.current_code,
    updated_at = now(),
    last_rotated_at = now(),
    rotated_by = EXCLUDED.rotated_by;
  RETURN v_code;
END;
$$;

-- Seed row if missing (run once on deploy)
SELECT public.ensure_registration_invite_row();
