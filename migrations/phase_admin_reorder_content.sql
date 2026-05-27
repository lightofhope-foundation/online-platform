-- Admin drag-and-drop: atomic chapter/video reorder (two-phase position update)

CREATE OR REPLACE FUNCTION public.admin_reorder_chapters (p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN;
  END IF;

  -- Phase 1: move out of the way
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.chapters
    SET
      position = (item->>'position')::int + 100000,
      updated_at = now()
    WHERE id = (item->>'id')::uuid;
  END LOOP;

  -- Phase 2: final positions
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.chapters
    SET
      position = (item->>'position')::int,
      updated_at = now()
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_videos (p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.videos
    SET
      position = (item->>'position')::int + 100000,
      chapter_id = (item->>'chapter_id')::uuid,
      updated_at = now()
    WHERE id = (item->>'id')::uuid;
  END LOOP;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.videos
    SET
      position = (item->>'position')::int,
      chapter_id = (item->>'chapter_id')::uuid,
      updated_at = now()
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;
