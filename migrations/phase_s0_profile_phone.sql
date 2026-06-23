-- Self-service profile: mobile phone on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

COMMENT ON COLUMN public.profiles.phone_number IS
  'Optional mobile number; editable by user in settings (admin/therapist/client).';
