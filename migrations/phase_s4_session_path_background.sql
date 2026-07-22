-- Phase S4: per-client Sitzungsakte hero background URL
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS session_path_background_url text;

COMMENT ON COLUMN public.clients.session_path_background_url IS
  'Optional Sitzungsakte hero background (Bunny CDN URL)';
