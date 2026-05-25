import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

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
  supabase: SupabaseClient<Database>
): Promise<PublishedVideoDetail[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("published", true)
    .is("deleted_at", null);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return [];

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position, title")
    .in("course_id", courseIds)
    .is("deleted_at", null);

  const chapterIds = (chapters ?? []).map((c) => c.id);
  if (chapterIds.length === 0) return [];

  const chapterById = new Map(
    (chapters ?? []).map((c) => [c.id, { position: c.position, title: c.title ?? "Kapitel" }])
  );

  const { data: videos } = await supabase
    .from("videos")
    .select("id, position, chapter_id, title")
    .in("chapter_id", chapterIds)
    .is("deleted_at", null);

  const sorted = [...(videos ?? [])].sort((a, b) => {
    const chA = chapterById.get(a.chapter_id)?.position ?? 0;
    const chB = chapterById.get(b.chapter_id)?.position ?? 0;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });

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
