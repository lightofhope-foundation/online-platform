-- Configurable client access levels (Stufen) — labels editable in admin settings (Phase 3.7 UI)
-- LOH Supabase only

CREATE TABLE IF NOT EXISTS public.platform_access_levels (
  access_level int PRIMARY KEY,
  label text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_access_levels_label_active_unique
  ON public.platform_access_levels (label)
  WHERE deleted_at IS NULL;

INSERT INTO public.platform_access_levels (access_level, label, sort_order)
SELECT v.level, v.label, v.level
FROM (
  VALUES
    (0, 'Stufe 0'),
    (1, 'Stufe 1'),
    (2, 'Stufe 2'),
    (3, 'Stufe 3'),
    (4, 'Stufe 4'),
    (5, 'Stufe 5')
) AS v (level, label)
ON CONFLICT (access_level) DO NOTHING;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_access_level_check;

ALTER TABLE public.platform_access_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pal_select_authenticated ON public.platform_access_levels;
CREATE POLICY pal_select_authenticated ON public.platform_access_levels
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
