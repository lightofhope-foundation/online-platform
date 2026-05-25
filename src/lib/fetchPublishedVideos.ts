import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { OrderedVideo } from "@/lib/videoUnlock";

/** Same global order as DB function get_published_videos_ordered(). */
export async function fetchPublishedVideosOrdered(
  supabase: SupabaseClient<Database>
): Promise<OrderedVideo[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("published", true)
    .is("deleted_at", null);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return [];

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, course_id")
    .in("course_id", courseIds)
    .is("deleted_at", null);

  const chapterIds = (chapters ?? []).map((c) => c.id);
  if (chapterIds.length === 0) return [];

  const chapterPosition = new Map((chapters ?? []).map((c) => [c.id, c.position]));

  const { data: videos } = await supabase
    .from("videos")
    .select("id, position, chapter_id")
    .in("chapter_id", chapterIds)
    .is("deleted_at", null);

  const sorted = [...(videos ?? [])].sort((a, b) => {
    const chA = chapterPosition.get(a.chapter_id) ?? 0;
    const chB = chapterPosition.get(b.chapter_id) ?? 0;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });

  return sorted.map((v) => ({ id: v.id, position: v.position }));
}
