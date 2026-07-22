-- Phase S3: 18 standard sessions + insertable Sondersitzungen on path

ALTER TABLE public.therapy_sessions
  ADD COLUMN IF NOT EXISTS is_special boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS path_order integer;

UPDATE public.therapy_sessions
SET path_order = session_number
WHERE path_order IS NULL;

ALTER TABLE public.therapy_sessions
  ALTER COLUMN path_order SET NOT NULL;

ALTER TABLE public.therapy_sessions
  DROP CONSTRAINT IF EXISTS therapy_sessions_session_number_check;

ALTER TABLE public.therapy_sessions
  ADD CONSTRAINT therapy_sessions_session_number_check
  CHECK (
    (is_special = true AND session_number >= 1001)
    OR (is_special = false AND session_number >= 1 AND session_number <= 18)
  );

CREATE UNIQUE INDEX IF NOT EXISTS therapy_sessions_client_path_order_idx
  ON public.therapy_sessions (client_user_id, path_order);

COMMENT ON COLUMN public.therapy_sessions.is_special IS 'Sondersitzung — red bubble on path, insertable between standard sessions';
COMMENT ON COLUMN public.therapy_sessions.path_order IS 'Visual order on serpentine path (1..n)';
