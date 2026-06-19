-- Phase V1: LOH course structure — topic board sequences + client topic assignment

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS board_slug text,
  ADD COLUMN IF NOT EXISTS is_intro boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS chapters_board_slug_idx ON public.chapters (board_slug)
  WHERE board_slug IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN public.chapters.board_slug IS 'Stable board key for LOH topic reordering (e.g. trennung, anxiety).';
COMMENT ON COLUMN public.chapters.is_intro IS 'True for the 4 fixed intro chapters shown before topic-specific boards.';

CREATE TABLE IF NOT EXISTS public.loh_topics (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loh_topic_board_sequences (
  topic_slug text NOT NULL REFERENCES public.loh_topics (slug) ON DELETE CASCADE,
  board_slug text NOT NULL,
  position smallint NOT NULL,
  PRIMARY KEY (topic_slug, board_slug),
  UNIQUE (topic_slug, position)
);

CREATE TABLE IF NOT EXISTS public.client_primary_topics (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  topic_slug text NOT NULL REFERENCES public.loh_topics (slug),
  source text NOT NULL DEFAULT 'default',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles (user_id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.client_primary_topics IS 'Primary Überbegriff per client; drives board chapter order after intro.';

INSERT INTO public.loh_topics (slug, display_name, sort_order) VALUES
  ('trennung', 'Trennung', 1),
  ('beziehung', 'Beziehung', 2),
  ('anxiety', 'Anxiety / Panik', 3),
  ('depression', 'Depression', 4),
  ('trauma', 'Trauma', 5),
  ('wut', 'Wutprobleme', 6)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order;

-- Board order per Überbegriff (matches videostruktur.md)
INSERT INTO public.loh_topic_board_sequences (topic_slug, board_slug, position) VALUES
  ('trennung', 'trennung', 1), ('trennung', 'selbstliebe', 2), ('trennung', 'traumata', 3),
  ('trennung', 'anxiety', 4), ('trennung', 'depression', 5), ('trennung', 'wutprobleme', 6), ('trennung', 'beziehung', 7),
  ('beziehung', 'beziehung', 1), ('beziehung', 'selbstliebe', 2), ('beziehung', 'traumata', 3),
  ('beziehung', 'anxiety', 4), ('beziehung', 'wutprobleme', 5), ('beziehung', 'depression', 6), ('beziehung', 'trennung', 7),
  ('anxiety', 'anxiety', 1), ('anxiety', 'traumata', 2), ('anxiety', 'selbstliebe', 3),
  ('anxiety', 'beziehung', 4), ('anxiety', 'depression', 5), ('anxiety', 'wutprobleme', 6), ('anxiety', 'trennung', 7),
  ('depression', 'depression', 1), ('depression', 'selbstliebe', 2), ('depression', 'traumata', 3),
  ('depression', 'anxiety', 4), ('depression', 'wutprobleme', 5), ('depression', 'beziehung', 6), ('depression', 'trennung', 7),
  ('trauma', 'traumata', 1), ('trauma', 'anxiety', 2), ('trauma', 'selbstliebe', 3),
  ('trauma', 'wutprobleme', 4), ('trauma', 'depression', 5), ('trauma', 'beziehung', 6), ('trauma', 'trennung', 7),
  ('wut', 'wutprobleme', 1), ('wut', 'traumata', 2), ('wut', 'selbstliebe', 3),
  ('wut', 'anxiety', 4), ('wut', 'depression', 5), ('wut', 'beziehung', 6), ('wut', 'trennung', 7)
ON CONFLICT (topic_slug, board_slug) DO UPDATE SET position = EXCLUDED.position;

ALTER TABLE public.loh_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loh_topic_board_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_primary_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loh_topics_read ON public.loh_topics;
DROP POLICY IF EXISTS loh_topic_board_sequences_read ON public.loh_topic_board_sequences;
DROP POLICY IF EXISTS client_primary_topics_select_own ON public.client_primary_topics;
DROP POLICY IF EXISTS client_primary_topics_select_admin ON public.client_primary_topics;
DROP POLICY IF EXISTS client_primary_topics_select_therapist ON public.client_primary_topics;

CREATE POLICY loh_topics_read ON public.loh_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY loh_topic_board_sequences_read ON public.loh_topic_board_sequences FOR SELECT TO authenticated USING (true);

CREATE POLICY client_primary_topics_select_own ON public.client_primary_topics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY client_primary_topics_select_admin ON public.client_primary_topics
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE POLICY client_primary_topics_select_therapist ON public.client_primary_topics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = client_primary_topics.user_id
        AND c.therapist_user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );
