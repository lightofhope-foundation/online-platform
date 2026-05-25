-- LOH Supabase only (project: tovojkwejkoysgygogfl)
-- Applied via MCP 2026-05-24

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_client_id_unique
  ON public.profiles (client_id)
  WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.client_id_counter (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  batch_num int NOT NULL DEFAULT 1 CHECK (batch_num >= 1 AND batch_num <= 99),
  seq_num int NOT NULL DEFAULT 0 CHECK (seq_num >= 0 AND seq_num <= 999),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- After first client 01angr001, next registration gets seq 002 in batch 01
INSERT INTO public.client_id_counter (id, batch_num, seq_num)
VALUES (1, 1, 1)
ON CONFLICT (id) DO UPDATE SET batch_num = 1, seq_num = 1, updated_at = now();

UPDATE public.profiles
SET client_id = '01angr001', first_name = 'Andreas', last_name = 'Gretzinger', updated_at = now()
WHERE user_id = 'a5e1174d-4e4a-4170-85a7-baa4519e3a21';
