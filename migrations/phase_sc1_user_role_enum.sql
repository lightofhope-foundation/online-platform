-- Must run before phase_sc1_setter_roles_platform.sql (enum values need committed transaction)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'setter_closer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teamlead';
