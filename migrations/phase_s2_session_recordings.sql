-- Phase S2: Sitzungsaufnahmen (Bunny Stream) pro Therapiesitzung

ALTER TABLE public.therapy_sessions
  ADD COLUMN IF NOT EXISTS recording_bunny_video_id text,
  ADD COLUMN IF NOT EXISTS recording_title text;

COMMENT ON COLUMN public.therapy_sessions.recording_bunny_video_id IS 'Bunny Stream GUID for session recording';
COMMENT ON COLUMN public.therapy_sessions.recording_title IS 'Display title for session recording in /sitzungsaufnahmen';
