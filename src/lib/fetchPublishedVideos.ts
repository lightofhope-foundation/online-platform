import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { OrderedVideo } from "@/lib/videoUnlock";
import { fetchClientPrimaryTopic } from "@/lib/fetchClientTopic";
import { sortVideosByTopicChapterOrder } from "@/lib/lohCourseOrder";
import { LOH_COURSE_SLUG } from "@/lib/lohVideoCatalog";

type ChapterRow = {
  id: string;
  position: number;
  course_id: string;
  board_slug: string | null;
  is_intro: boolean;
};

/** Published videos in global order; LOH course uses client topic for board reordering. */
export async function fetchPublishedVideosOrdered(
  supabase: SupabaseClient<Database>,
  userId?: string | null
): Promise<OrderedVideo[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("published", true)
    .is("deleted_at", null);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return [];

  const lohCourse = (courses ?? []).find((c) => c.slug === LOH_COURSE_SLUG);
  const topicSlug = lohCourse ? await fetchClientPrimaryTopic(supabase, userId) : null;

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, course_id, board_slug, is_intro")
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

  let sorted = [...(videos ?? [])].sort((a, b) => {
    const chA = chapterPosition.get(a.chapter_id) ?? 0;
    const chB = chapterPosition.get(b.chapter_id) ?? 0;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });

  if (lohCourse && topicSlug) {
    const lohChapters = (chapters ?? []).filter(
      (c) => c.course_id === lohCourse.id
    ) as ChapterRow[];
    const lohChapterIds = new Set(lohChapters.map((c) => c.id));
    const lohVideos = (videos ?? []).filter((v) => lohChapterIds.has(v.chapter_id));
    const otherVideos = (videos ?? []).filter((v) => !lohChapterIds.has(v.chapter_id));

    const orderedLoh = sortVideosByTopicChapterOrder(lohChapters, lohVideos, topicSlug);
    const orderedOther = [...otherVideos].sort((a, b) => {
      const chA = chapterPosition.get(a.chapter_id) ?? 0;
      const chB = chapterPosition.get(b.chapter_id) ?? 0;
      if (chA !== chB) return chA - chB;
      return a.position - b.position;
    });
    sorted = [...orderedLoh, ...orderedOther];
  }

  return sorted.map((v) => ({ id: v.id, position: v.position }));
}
