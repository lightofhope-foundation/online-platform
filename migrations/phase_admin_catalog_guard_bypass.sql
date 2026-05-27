-- Allow service-role server actions + admin reorder RPC to update catalog fields.
-- Fixes: "Only deleted_at can be changed by non-admins" when dragging videos in admin.

CREATE OR REPLACE FUNCTION public.only_deleted_at_change_for_non_admin ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Supabase service role (Next.js admin server actions / RPC)
  IF coalesce(auth.jwt () ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Set by admin_reorder_* RPC when JWT context is missing
  IF current_setting('app.bypass_catalog_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin () THEN
    RETURN NEW;
  END IF;

  -- Non-admins may only soft-delete (ignore updated_at from other triggers)
  IF to_jsonb(NEW) - 'deleted_at' - 'updated_at'
     IS DISTINCT FROM to_jsonb(OLD) - 'deleted_at' - 'updated_at'
  THEN
    RAISE EXCEPTION 'Only deleted_at can be changed by non-admins';
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure reorder RPCs set bypass flag (belt-and-suspenders)
CREATE OR REPLACE FUNCTION public.admin_reorder_chapters (p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  PERFORM set_config('app.bypass_catalog_guard', 'on', true);

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.chapters
    SET
      position = (item->>'position')::int + 100000,
      updated_at = now()
    WHERE id = (item->>'id')::uuid;
  END LOOP;

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
  PERFORM set_config('app.bypass_catalog_guard', 'on', true);

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
