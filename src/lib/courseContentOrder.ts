export type ChapterOrderRow = {
  id: string;
  position: number;
  title?: string;
};

export type VideoOrderRow = {
  id: string;
  chapter_id: string;
  position: number;
};

/** Sort videos by chapter.position, then video.position (published course order). */
export function sortVideosByChapterOrder<
  T extends VideoOrderRow,
  C extends ChapterOrderRow,
>(chapters: C[], videos: T[]): T[] {
  const chapterOrder = new Map(chapters.map((c) => [c.id, c.position]));
  return [...videos].sort((a, b) => {
    const chA = chapterOrder.get(a.chapter_id) ?? 9999;
    const chB = chapterOrder.get(b.chapter_id) ?? 9999;
    if (chA !== chB) return chA - chB;
    return a.position - b.position;
  });
}

export function normalizeChapterPositions<T extends ChapterOrderRow & { course_id: string }>(
  chapters: T[]
): T[] {
  const byCourse = new Map<string, T[]>();
  for (const ch of chapters) {
    if (!byCourse.has(ch.course_id)) byCourse.set(ch.course_id, []);
    byCourse.get(ch.course_id)!.push(ch);
  }
  const result: T[] = [];
  for (const list of byCourse.values()) {
    list.sort((a, b) => a.position - b.position);
    list.forEach((ch, i) => result.push({ ...ch, position: i + 1 }));
  }
  return result;
}

export function normalizeVideoPositions<T extends VideoOrderRow>(videos: T[]): T[] {
  const byChapter = new Map<string, T[]>();
  for (const v of videos) {
    if (!byChapter.has(v.chapter_id)) byChapter.set(v.chapter_id, []);
    byChapter.get(v.chapter_id)!.push(v);
  }
  const result: T[] = [];
  for (const list of byChapter.values()) {
    list.sort((a, b) => a.position - b.position);
    list.forEach((v, i) => result.push({ ...v, position: i + 1 }));
  }
  return result;
}
