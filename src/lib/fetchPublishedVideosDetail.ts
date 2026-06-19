import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { fetchClientPrimaryTopic } from "@/lib/fetchClientTopic";
import { orderChaptersForTopic, sortVideosByTopicChapterOrder } from "@/lib/lohCourseOrder";
import { LOH_COURSE_SLUG } from "@/lib/lohVideoCatalog";

export type PublishedVideoDetail = {
  id: string;
  position: number;
  globalPosition: number;
  title: string;
  chapterTitle: string;
  chapterPosition: number;
};

/** Published videos in global course order with display metadata. */
export async function fetchPublishedVideosDetail(
  supabase: SupabaseClient<Database>,
  userId?: string | null
): Promise<PublishedVideoDetail[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("published", true)
    .is("deleted_at", null);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return [];

  const lohCourse = (courses ?? []).find((c) => c.slug === LOH_COURSE_SLUG);
  const topicSlug = lohCourse && userId ? await fetchClientPrimaryTopic(supabase, userId) : null;

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, title, course_id, board_slug, is_intro")
    .in("course_id", courseIds)
    .is("deleted_at", null);

  const chapterIds = (chapters ?? []).map((c) => c.id);
  if (chapterIds.length === 0) return [];

  const orderedChapters =
    lohCourse && topicSlug
      ? [
          ...orderChaptersForTopic(
            (chapters ?? []).filter((c) => c.course_id === lohCourse.id),
            topicSlug
          ),
          ...(chapters ?? []).filter((c) => c.course_id !== lohCourse.id),
        ]
      : (chapters ?? []);

  const chapterById = new Map(
    orderedChapters.map((c) => [c.id, { position: c.position, title: c.title ?? "Kapitel" }])
  );

  const { data: videos } = await supabase
    .from("videos")
    .select("id, position, chapter_id, title")
    .in("chapter_id", chapterIds)
    .is("deleted_at", null);

  let sorted = [...(videos ?? [])].sort((a, b) => {
    const chA = chapterById.get(a.chapter_id)?.position ?? 0;
    const chB = chapterById.get(b.chapter_id)?.position ?? 0;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });

  if (lohCourse && topicSlug) {
    const lohChapters = orderedChapters.filter((c) => c.course_id === lohCourse.id);
    const lohChapterIds = new Set(lohChapters.map((c) => c.id));
    const lohVideos = (videos ?? []).filter((v) => lohChapterIds.has(v.chapter_id));
    const otherVideos = (videos ?? []).filter((v) => !lohChapterIds.has(v.chapter_id));
    const orderedLoh = sortVideosByTopicChapterOrder(lohChapters, lohVideos, topicSlug);
    const orderedOther = [...otherVideos].sort((a, b) => {
      const chA = chapterById.get(a.chapter_id)?.position ?? 0;
      const chB = chapterById.get(b.chapter_id)?.position ?? 0;
      if (chA !== chB) return chA - chB;
      return a.position - b.position;
    });
    sorted = [...orderedLoh, ...orderedOther];
  }

  return sorted.map((v, index) => {
    const ch = chapterById.get(v.chapter_id);
    return {
      id: v.id,
      position: v.position,
      globalPosition: index + 1,
      title: v.title ?? `Video ${index + 1}`,
      chapterTitle: ch?.title ?? "Kapitel",
      chapterPosition: ch?.position ?? 0,
    };
  });
}
