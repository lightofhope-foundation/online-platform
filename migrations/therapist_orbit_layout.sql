-- Orbit layout: Y position + side per therapist/client pair
CREATE TABLE IF NOT EXISTS public.therapist_orbit_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pos_y numeric NOT NULL DEFAULT 0.5 CHECK (pos_y >= 0 AND pos_y <= 1),
  side text NOT NULL DEFAULT 'left' CHECK (side IN ('left', 'right')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (therapist_user_id, client_user_id)
);

CREATE INDEX IF NOT EXISTS therapist_orbit_layout_therapist_idx
  ON public.therapist_orbit_layout (therapist_user_id);

ALTER TABLE public.therapist_orbit_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY therapist_orbit_layout_select ON public.therapist_orbit_layout
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR therapist_user_id = auth.uid()
  );

CREATE POLICY therapist_orbit_layout_insert ON public.therapist_orbit_layout
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR therapist_user_id = auth.uid()
  );

CREATE POLICY therapist_orbit_layout_update ON public.therapist_orbit_layout
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR therapist_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR therapist_user_id = auth.uid()
  );

CREATE POLICY therapist_orbit_layout_delete ON public.therapist_orbit_layout
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR therapist_user_id = auth.uid()
  );
