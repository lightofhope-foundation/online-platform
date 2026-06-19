-- Phase T0: Therapist role foundation — RLS, client rows, test seed

-- Therapist may read profiles of assigned clients
DROP POLICY IF EXISTS profiles_select_therapist_assigned ON public.profiles;
CREATE POLICY profiles_select_therapist_assigned ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_therapist()
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.user_id = profiles.user_id
        AND c.therapist_user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

-- Therapist may read unlock schedule for assigned clients
DROP POLICY IF EXISTS uvu_select_therapist_assigned ON public.user_video_unlocks;
CREATE POLICY uvu_select_therapist_assigned ON public.user_video_unlocks
  FOR SELECT TO authenticated
  USING (
    public.is_therapist()
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.user_id = user_video_unlocks.user_id
        AND c.therapist_user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

-- Ensure clients rows exist for all client-role profiles
INSERT INTO public.clients (user_id, therapist_user_id, is_paid, access_revoked)
SELECT p.user_id, NULL, true, false
FROM public.profiles p
WHERE p.role IN ('client', 'patient')
ON CONFLICT (user_id) DO NOTHING;

-- Promote test account to therapist (3-role testing)
UPDATE public.profiles
SET role = 'therapist'
WHERE user_id = 'a5e1174d-4e4a-4170-85a7-baa4519e3a21';

-- Assign test clients to Andreas Gretzinger (therapist) for T0 smoke test
UPDATE public.clients
SET therapist_user_id = 'a5e1174d-4e4a-4170-85a7-baa4519e3a21',
    updated_at = now()
WHERE user_id IN (
  'ca26c5da-10c6-41a9-92bd-930365fbbfbe',
  '7f97cc70-e2a6-43a8-9957-e55f4515a201'
);
