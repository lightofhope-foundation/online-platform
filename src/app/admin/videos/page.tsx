import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function softDeleteVideo(id: string) {
  "use server";
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return;
  await supabase.from("videos").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/videos");
}

export default async function AdminVideos({ searchParams }: { searchParams: { course?: string } }) {
  const supabase = getSupabaseServerClient();
  const courseId = searchParams?.course ?? "";

  const { data: courses } = await supabase
    .from("courses")
    .select("id,title")
    .order("title");

  let chaptersQuery = supabase.from("chapters").select("id,title,position,course_id").order("position");
  if (courseId) chaptersQuery = chaptersQuery.eq("course_id", courseId);
  const { data: chapters } = await chaptersQuery;

  const { data: videos } = await supabase
    .from("videos")
    .select("id,title,chapter_id,position,deleted_at,bunny_video_id,requires_workbook,updated_at")
    .order("position");

  const filteredChapters = (chapters ?? []).filter((c: any) => !courseId || c.course_id === courseId);

  const chaptersByCourse = new Map<string, any[]>();
  for (const c of filteredChapters) {
    if (!chaptersByCourse.has(c.course_id)) chaptersByCourse.set(c.course_id, []);
    chaptersByCourse.get(c.course_id)!.push(c);
  }

  const videosByChapter = new Map<string, any[]>();
  for (const v of videos ?? []) {
    if (!videosByChapter.has(v.chapter_id)) videosByChapter.set(v.chapter_id, []);
    videosByChapter.get(v.chapter_id)!.push(v);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manage Videos &amp; Chapters</h1>
        <div className="flex gap-3">
          <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <form method="get" className="mb-4 flex items-center gap-2">
        <label htmlFor="course" className="text-sm text-white/70">
          Filter course:
        </label>
        <select
          id="course"
          name="course"
          defaultValue={courseId}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="">All</option>
          {(courses ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button type="submit" className="px-3 py-1 rounded border border-white/20 hover:bg-white/10 text-sm">
          Apply
        </button>
      </form>

      {(courses ?? [])
        .filter((c: any) => !courseId || c.id === courseId)
        .map((course: any) => (
          <div key={course.id} className="mb-8">
            <h2 className="text-lg font-medium mb-3">{course.title}</h2>
            <div className="space-y-2">
              {(chaptersByCourse.get(course.id) ?? []).map((ch: any) => (
                <div key={ch.id} className="rounded-lg border border-white/10">
                  <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                    <div className="font-medium">
                      {ch.position}. {ch.title}
                    </div>
                  </div>
                  <div className="divide-y divide-white/10">
                    {(videosByChapter.get(ch.id) ?? []).map((v: any) => (
                      <form key={v.id} action={async () => { "use server"; await softDeleteVideo(v.id); }}>
                        <div className="flex items-center justify-between px-3 py-2">
                          <div>
                            <div className="font-medium">
                              {v.position}. {v.title}
                              {v.deleted_at ? (
                                <span className="ml-2 text-xs text-red-400">(deleted)</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-white/60 break-all">{v.bunny_video_id || "—"}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/video/${v.id}`} className="text-sm text-[#63eca9] hover:underline">
                              Open
                            </Link>
                            {!v.deleted_at ? (
                              <button type="submit" className="text-sm text-red-400 hover:underline">
                                Soft‑delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </form>
                    ))}
                    {(videosByChapter.get(ch.id) ?? []).length === 0 && (
                      <div className="px-3 py-3 text-sm text-white/60">No videos in this chapter.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

