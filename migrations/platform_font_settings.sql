-- Platform typography settings (single-row, admin-editable, realtime)
CREATE TABLE IF NOT EXISTS public.platform_font_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  headline_font text NOT NULL DEFAULT 'chalkboy',
  section_font text NOT NULL DEFAULT 'doublefinger',
  body_font text NOT NULL DEFAULT 'rns-sanz',
  menu_font text NOT NULL DEFAULT 'rns-sanz',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

INSERT INTO public.platform_font_settings (id, headline_font, section_font, body_font, menu_font)
VALUES (1, 'chalkboy', 'doublefinger', 'rns-sanz', 'rns-sanz')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_font_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pfs_select_authenticated ON public.platform_font_settings;
CREATE POLICY pfs_select_authenticated ON public.platform_font_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pfs_update_admin ON public.platform_font_settings;
CREATE POLICY pfs_update_admin ON public.platform_font_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );
