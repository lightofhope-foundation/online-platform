import Link from "next/link";
import { TherapistClientsTable, type TherapistClientRow } from "@/components/therapist/TherapistClientsTable";
import { checkTherapistAccess } from "@/lib/authRoles";
import { formatGermanDateTime } from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function TherapistClientsPage() {
  const { user, supabase } = await checkTherapistAccess();

  const { data: assignments } = await supabase
    .from("clients")
    .select("user_id")
    .eq("therapist_user_id", user.id)
    .is("deleted_at", null);

  const clientUserIds = (assignments ?? []).map((a) => a.user_id);

  let profiles: {
    user_id: string;
    client_id: string | null;
    first_name: string | null;
    last_name: string | null;
    access_level: number;
    created_at: string;
    display_alias: string | null;
  }[] = [];

  if (clientUserIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, client_id, first_name, last_name, access_level, created_at, display_alias")
      .in("user_id", clientUserIds);
    profiles = data ?? [];
  }

  const authById = new Map<string, { email?: string; last_sign_in_at?: string }>();
  if (clientUserIds.length > 0) {
    const { data: authUsersRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authUsersRes?.users ?? []) {
      if (clientUserIds.includes(u.id)) {
        authById.set(u.id, u);
      }
    }
  }

  const videoProgressByUser = new Map<string, number>();
  const { data: publishedCourses } = await supabase
    .from("courses")
    .select("id")
    .eq("published", true)
    .is("deleted_at", null);
  const courseIds = (publishedCourses ?? []).map((c) => c.id);

  if (courseIds.length > 0 && clientUserIds.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .in("course_id", courseIds)
      .is("deleted_at", null);
    const chapterIds = (chapters ?? []).map((c) => c.id);

    if (chapterIds.length > 0) {
      const { data: videos } = await supabase
        .from("videos")
        .select("id")
        .in("chapter_id", chapterIds)
        .is("deleted_at", null);
      const totalVideoIds = new Set((videos ?? []).map((v) => v.id));
      const totalVideos = totalVideoIds.size;

      if (totalVideos > 0) {
        const { data: progressRows } = await supabase
          .from("video_progress")
          .select("user_id, video_id, completed_at")
          .in("user_id", clientUserIds)
          .not("completed_at", "is", null);

        const completedByUser = new Map<string, Set<string>>();
        (progressRows ?? []).forEach((row) => {
          if (!totalVideoIds.has(row.video_id)) return;
          if (!completedByUser.has(row.user_id)) completedByUser.set(row.user_id, new Set());
          completedByUser.get(row.user_id)!.add(row.video_id);
        });
        completedByUser.forEach((videoIds, userId) => {
          videoProgressByUser.set(userId, Math.round((videoIds.size / totalVideos) * 100));
        });
      }
    }
  }

  const rows: TherapistClientRow[] = profiles.map((p) => {
    const au = authById.get(p.user_id);
    const detailHref = p.client_id ? `/therapist/clients/${p.client_id.toLowerCase()}` : null;
    return {
      user_id: p.user_id,
      client_id: p.client_id,
      email: au?.email ?? "—",
      name: resolvePersonLabel(p.first_name, p.last_name, au?.email, p.display_alias),
      access_level: p.access_level ?? 0,
      video_progress: videoProgressByUser.get(p.user_id) ?? 0,
      created_at: formatGermanDateTime(p.created_at),
      last_login: formatGermanDateTime(au?.last_sign_in_at),
      detail_href: detailHref,
    };
  });

  return (
    <div className="mx-auto w-[90%] max-w-[90vw] space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/therapist" className="text-sm text-[#63eca9] hover:underline">
            ← Zurück zum Überblick
          </Link>
          <h1 className="mt-2 text-xl font-semibold">Klient:innen</h1>
        </div>
      </div>

      <TherapistClientsTable rows={rows} />
    </div>
  );
}
