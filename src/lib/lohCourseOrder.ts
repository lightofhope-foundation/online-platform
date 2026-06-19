import {
  DEFAULT_LOH_TOPIC,
  LOH_COURSE_SLUG,
  LOH_TOPIC_BOARD_SEQUENCES,
  type LohBoardSlug,
} from "@/lib/lohVideoCatalog";

export type ChapterOrderInput = {
  id: string;
  position: number;
  title?: string;
  board_slug?: string | null;
  is_intro?: boolean | null;
  course_id?: string;
};

export type VideoOrderInput = {
  id: string;
  chapter_id: string;
  position: number;
};

export function isLohCourseSlug(slug: string | null | undefined): boolean {
  return slug === LOH_COURSE_SLUG;
}

export function resolveTopicSlug(topicSlug: string | null | undefined): string {
  if (topicSlug && LOH_TOPIC_BOARD_SEQUENCES[topicSlug]) return topicSlug;
  return DEFAULT_LOH_TOPIC;
}

/** Client-facing chapter order: intro chapters first, then boards per Überbegriff. */
export function orderChaptersForTopic<T extends ChapterOrderInput>(
  chapters: T[],
  topicSlug: string | null | undefined
): T[] {
  const topic = resolveTopicSlug(topicSlug);
  const sequence = LOH_TOPIC_BOARD_SEQUENCES[topic] ?? LOH_TOPIC_BOARD_SEQUENCES[DEFAULT_LOH_TOPIC];

  const intros = chapters
    .filter((c) => c.is_intro)
    .sort((a, b) => a.position - b.position);

  const boardsBySlug = new Map<string, T>();
  for (const ch of chapters) {
    if (!ch.is_intro && ch.board_slug) {
      boardsBySlug.set(ch.board_slug, ch);
    }
  }

  const orderedBoards: T[] = [];
  for (const slug of sequence) {
    const ch = boardsBySlug.get(slug);
    if (ch) orderedBoards.push(ch);
  }

  const ordered = [...intros, ...orderedBoards];
  return ordered.map((ch, index) => ({ ...ch, position: index + 1 }));
}

export function sortVideosByTopicChapterOrder<
  T extends VideoOrderInput,
  C extends ChapterOrderInput,
>(chapters: C[], videos: T[], topicSlug: string | null | undefined): T[] {
  const orderedChapters = orderChaptersForTopic(chapters, topicSlug);
  const chapterOrder = new Map(orderedChapters.map((c) => [c.id, c.position]));
  return [...videos].sort((a, b) => {
    const chA = chapterOrder.get(a.chapter_id) ?? 9999;
    const chB = chapterOrder.get(b.chapter_id) ?? 9999;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });
}

export function boardSlugFromChapter(chapter: ChapterOrderInput): LohBoardSlug | null {
  return (chapter.board_slug as LohBoardSlug | null) ?? null;
}
