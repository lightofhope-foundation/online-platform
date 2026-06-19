-- Phase T1: Admin display aliases for therapists and clients

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_alias text;

COMMENT ON COLUMN public.profiles.display_alias IS
  'Optional admin-defined short label, e.g. Andreas G. or Andy G.';

-- Default alias for test therapist
UPDATE public.profiles
SET display_alias = 'Andreas G.'
WHERE user_id = 'a5e1174d-4e4a-4170-85a7-baa4519e3a21'
  AND (display_alias IS NULL OR display_alias = '');
