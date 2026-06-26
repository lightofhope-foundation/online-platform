-- Phase S1: 14 therapy sessions per client + session notes feed

CREATE TABLE IF NOT EXISTS public.therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_number integer NOT NULL CHECK (session_number >= 1 AND session_number <= 14),
  released_to_client boolean NOT NULL DEFAULT false,
  topic text,
  scheduled_at timestamptz,
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_user_id, session_number)
);

CREATE INDEX IF NOT EXISTS therapy_sessions_client_user_id_idx
  ON public.therapy_sessions (client_user_id);

CREATE TABLE IF NOT EXISTS public.therapy_session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.therapy_sessions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  therapist_body text,
  client_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS therapy_session_notes_session_id_idx
  ON public.therapy_session_notes (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.therapy_session_note_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.therapy_session_notes(id) ON DELETE CASCADE,
  therapist_body_before text,
  therapist_body_after text,
  client_body_before text,
  client_body_after text,
  changed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS therapy_session_note_revisions_note_id_idx
  ON public.therapy_session_note_revisions (note_id, changed_at DESC);

ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_session_note_revisions ENABLE ROW LEVEL SECURITY;

-- Server actions use service role; RLS policies for direct client access in S2

COMMENT ON TABLE public.therapy_sessions IS '14 sessions per client therapy journey (Phase S)';
COMMENT ON TABLE public.therapy_session_notes IS 'Chronological feed entries per session';
COMMENT ON TABLE public.therapy_session_note_revisions IS 'Admin-only edit history for session notes';
