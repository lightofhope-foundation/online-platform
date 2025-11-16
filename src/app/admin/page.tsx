import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = getSupabaseServerClient();
  const admin = getSupabaseAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);

  const { count: progressCount } = await admin
    .from("video_progress")
    .select("*", { count: "exact", head: true });

  const { count: userCount } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/videos" className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10">
            Manage Videos &amp; Chapters
          </Link>
          <Link href="/admin/users" className="rounded-md border border-white/20 px-3 py-2 hover:bg-white/10">
            Users &amp; Progress
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Courses" value={courses?.length ?? 0} />
        <StatCard label="Users" value={userCount ?? 0} />
        <StatCard label="Progress Rows" value={progressCount ?? 0} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Recent Courses</h2>
        <div className="rounded-lg border border-white/10 divide-y divide-white/10">
          {(courses ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-white/60">{c.slug}</div>
              </div>
              <Link href={`/admin/videos?${new URLSearchParams({ course: c.id }).toString()}`} className="text-sm text-[#63eca9] hover:underline">
                Manage
              </Link>
            </div>
          ))}
          {(!courses || courses.length === 0) && (
            <div className="px-4 py-6 text-sm text-white/60">No courses yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}


