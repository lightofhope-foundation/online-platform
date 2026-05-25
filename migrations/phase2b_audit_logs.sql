-- Phase 2b: audit trail for admin unlock edits (LOH Supabase only)

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
