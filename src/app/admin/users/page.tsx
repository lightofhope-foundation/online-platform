import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/AdminUsersTable";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { fetchClientTherapistMap } from "@/lib/adminTherapistData";
import { formatGermanDateTime } from "@/lib/clientId";

export const dynamic = "force-dynamic";

type Profile = {
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  client_id: string | null;
  access_level: number;
};

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function AdminUsers() {
  let profiles: Profile[] = [];
  let authById = new Map<string, { email?: string; last_sign_in_at?: string }>();
  const videoProgressByUser = new Map<string, number>();
  const accessLevels = await fetchAccessLevelOptions();

  let therapistByClient = new Map<string, { therapist_user_id: string; label: string }>();

  try {
    const admin = getSupabaseAdminClient();

    const { data: publishedCourses } = await admin
      .from("courses")
      .select("id")
      .eq("published", true)
      .is("deleted_at", null);
    const courseIds = (publishedCourses ?? []).map((c) => c.id);
    if (courseIds.length > 0) {
      const { data: chapters } = await admin
        .from("chapters")
        .select("id")
        .in("course_id", courseIds)
        .is("deleted_at", null);
      const chapterIds = (chapters ?? []).map((c) => c.id);
      if (chapterIds.length > 0) {
        const { data: videos } = await admin
          .from("videos")
          .select("id")
          .in("chapter_id", chapterIds)
          .is("deleted_at", null);
        const totalVideoIds = new Set((videos ?? []).map((v) => v.id));
        const totalVideos = totalVideoIds.size;

        if (totalVideos > 0) {
          const { data: progressRows } = await admin
            .from("video_progress")
            .select("user_id, video_id, completed_at")
            .not("completed_at", "is", null);

          const completedByUser = new Map<string, Set<string>>();
          (progressRows ?? []).forEach((row: { user_id: string; video_id: string }) => {
            if (!totalVideoIds.has(row.video_id)) return;
            if (!completedByUser.has(row.user_id)) completedByUser.set(row.user_id, new Set());
            completedByUser.get(row.user_id)!.add(row.video_id);
          });
          completedByUser.forEach((videoIds, userId) => {
            videoProgressByUser.set(
              userId,
              Math.round((videoIds.size / totalVideos) * 100)
            );
          });
        }
      }
    }

    const profilesResult = await admin
      .from("profiles")
      .select("user_id, role, created_at, first_name, last_name, client_id, access_level")
      .order("created_at", { ascending: false });

    if (!profilesResult.error) {
      profiles = profilesResult.data ?? [];
    }

    const { data: authUsersRes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authById = new Map((authUsersRes?.users ?? []).map((u) => [u.id, u]));

    therapistByClient = await fetchClientTherapistMap(admin);
  } catch (error) {
    console.error("Error initializing admin client:", error);
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Nutzer & Fortschritt</h1>
          <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <p className="font-semibold">Fehler: SUPABASE_SERVICE_ROLE_KEY fehlt</p>
        </div>
      </div>
    );
  }

  const rows: AdminUserRow[] = profiles.map((p) => {
    const au = authById.get(p.user_id);
    const detailHref = p.client_id ? `/admin/users/${p.client_id.toLowerCase()}` : null;
    const therapist = therapistByClient.get(p.user_id);
    return {
      user_id: p.user_id,
      client_id: p.client_id,
      email: au?.email ?? "—",
      name: formatFullName(p.first_name, p.last_name),
      role: p.role,
      access_level: p.access_level ?? 0,
      video_progress: p.role === "client" ? videoProgressByUser.get(p.user_id) ?? 0 : null,
      therapist_label: therapist?.label ?? null,
      therapist_href: therapist
        ? `/admin/therapists/${therapist.therapist_user_id}`
        : null,
      created_at: formatGermanDateTime(p.created_at),
      last_login: formatGermanDateTime(au?.last_sign_in_at),
      detail_href: detailHref,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nutzer & Fortschritt</h1>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          Zurück zum Dashboard
        </Link>
      </div>

      <AdminUsersTable rows={rows} accessLevels={accessLevels} />
    </div>
  );
}
