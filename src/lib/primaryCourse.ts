import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type PublishedCourseLink = {
  id: string;
  slug: string;
  title: string;
};

/**
 * Resolves the client's main course link from the database (never hardcoded slugs).
 * Uses the oldest published course; when multiple exist, prefer the one with recent progress.
 */
export async function fetchPrimaryPublishedCourse(
  supabase: SupabaseClient<Database>,
  preferredCourseId?: string | null
): Promise<PublishedCourseLink | null> {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, slug, title, created_at")
    .eq("published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error || !courses?.length) return null;

  if (preferredCourseId) {
    const preferred = courses.find((c) => c.id === preferredCourseId);
    if (preferred?.slug) {
      return { id: preferred.id, slug: preferred.slug, title: preferred.title };
    }
  }

  const first = courses[0];
  return first?.slug
    ? { id: first.id, slug: first.slug, title: first.title }
    : null;
}

export function courseDetailPath(slug: string): string {
  return `/courses/${encodeURIComponent(slug)}`;
}
