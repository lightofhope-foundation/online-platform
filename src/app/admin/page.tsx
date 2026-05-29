import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
  let progressCount: number | null = null;
  let userCount: number | null = null;
  let courses: { id: string; title: string; slug: string; updated_at: string }[] | null = null;

  try {
    supabase = getSupabaseAdminClient();
    const progressResult = await supabase
      .from("video_progress")
      .select("*", { count: "exact", head: true });
    progressCount = progressResult.count;

    const userResult = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    userCount = userResult.count;

    const coursesResult = await supabase
      .from("courses")
      .select("id,title,slug,updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(8);
    courses = coursesResult.data;
  } catch (error) {
    console.error("Error initializing admin client:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Überblick</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/videos" className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10">
            Kurse &amp; Kapitel verwalten
          </Link>
          <Link href="/admin/users" className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10">
            Nutzer &amp; Fortschritt
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Kurse" value={courses?.length ?? 0} />
        <StatCard label="Nutzer" value={userCount ?? 0} />
        <StatCard label="Fortschritt-Einträge" value={progressCount ?? 0} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Aktuelle Kurse</h2>
        <div className="rounded-lg border border-white/10 divide-y divide-white/10">
          {(courses ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-white/60">{c.slug}</div>
              </div>
              <Link href={`/admin/videos?${new URLSearchParams({ course: c.id }).toString()}`} className="text-sm text-[#63eca9] hover:underline">
                Verwalten
              </Link>
            </div>
          ))}
          {(!courses || courses.length === 0) && (
            <div className="px-4 py-6 text-sm text-white/60">Noch keine Kurse.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}


