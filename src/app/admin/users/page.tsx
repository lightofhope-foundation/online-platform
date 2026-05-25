import type { ReactNode } from "react";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { formatGermanDateTime } from "@/lib/clientId";

export const dynamic = "force-dynamic";

type Profile = {
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  client_id: string | null;
};

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

function UserRowLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) {
    return <span className="block text-white/80">{children}</span>;
  }
  return (
    <Link href={href} className="block transition-colors hover:text-[#63eca9]">
      {children}
    </Link>
  );
}

export default async function AdminUsers() {
  let admin: ReturnType<typeof getSupabaseAdminClient> | undefined;
  let profiles: Profile[] = [];
  let authById = new Map<string, { email?: string; last_sign_in_at?: string }>();
  const videoProgressByUser = new Map<string, number>();

  try {
    admin = getSupabaseAdminClient();

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
      .select("user_id, role, created_at, first_name, last_name, client_id")
      .order("created_at", { ascending: false });

    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error);
      profiles = [];
    } else {
      profiles = profilesResult.data ?? [];
    }

    const { data: authUsersRes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authById = new Map((authUsersRes?.users ?? []).map((u) => [u.id, u]));
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nutzer & Fortschritt</h1>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          Zurück zum Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-3 py-2">Nutzer-ID</th>
              <th className="px-3 py-2">E-Mail</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Rolle</th>
              <th className="px-3 py-2">Video-Fortschritt</th>
              <th className="px-3 py-2">Erstellt</th>
              <th className="px-3 py-2">Letzter Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {profiles.map((p) => {
              const au = authById.get(p.user_id);
              const detailHref = p.client_id ? `/admin/users/${p.client_id.toLowerCase()}` : null;
              return (
                <tr key={p.user_id}>
                  <td className="px-3 py-2 font-mono text-xs">
                    <UserRowLink href={detailHref}>{p.client_id ?? "—"}</UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>{au?.email ?? "—"}</UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>
                      {formatFullName(p.first_name, p.last_name)}
                    </UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>{p.role}</UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>
                      {p.role === "client"
                        ? `${videoProgressByUser.get(p.user_id) ?? 0}%`
                        : "—"}
                    </UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>
                      {formatGermanDateTime(p.created_at)}
                    </UserRowLink>
                  </td>
                  <td className="px-3 py-2">
                    <UserRowLink href={detailHref}>
                      {formatGermanDateTime(au?.last_sign_in_at)}
                    </UserRowLink>
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-white/60">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
