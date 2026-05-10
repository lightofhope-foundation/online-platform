import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Profile = {
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
};

type ProfileRow = {
  user_id: string;
  role: string;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
};

// Helper function to generate user slug: firstname-lastname-lastthreedigitsofuserID
function generateUserSlug(firstName: string | null, lastName: string | null, userId: string): string {
  const first = (firstName ?? "").toLowerCase().trim();
  const last = (lastName ?? "").toLowerCase().trim();
  const lastThree = userId.slice(-3).toLowerCase();
  
  const parts = [];
  if (first) parts.push(first);
  if (last) parts.push(last);
  if (lastThree) parts.push(lastThree);
  
  return parts.join("-") || userId.slice(-3).toLowerCase();
}

// Helper function to format full name
function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function AdminUsers() {
  // Use the Service Role client so admin can see all users, bypassing RLS.
  let admin: ReturnType<typeof getSupabaseAdminClient> | undefined;
  let profiles: Profile[] = [];
  let authById = new Map<string, { email?: string; last_sign_in_at?: string }>();
  const videoProgressByUser = new Map<string, number>(); // user_id -> overall video progress %

  try {
    admin = getSupabaseAdminClient();

    // Total videos (published courses, non-deleted chapters/videos)
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

          const completedByUser = new Map<string, Set<string>>(); // user_id -> set of video_ids completed
          (progressRows ?? []).forEach((row: { user_id: string; video_id: string }) => {
            if (!totalVideoIds.has(row.video_id)) return;
            if (!completedByUser.has(row.user_id)) completedByUser.set(row.user_id, new Set());
            completedByUser.get(row.user_id)!.add(row.video_id);
          });
          completedByUser.forEach((videoIds, userId) => {
            const completed = videoIds.size;
            videoProgressByUser.set(userId, Math.round((completed / totalVideos) * 100));
          });
        }
      }
    }

    // Try to select first_name and last_name, but fall back if columns don't exist yet
    const profilesResult = await admin
      .from("profiles")
      .select("user_id, role, created_at, first_name, last_name")
      .order("created_at", { ascending: false });

    if (profilesResult.error) {
      console.log("Columns might not exist, trying without first_name/last_name:", profilesResult.error.message);
      const fallbackResult = await admin
        .from("profiles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: false });
      if (fallbackResult.error) {
        console.error("Error fetching profiles:", fallbackResult.error);
        profiles = [];
      } else {
        profiles = (fallbackResult.data ?? []).map((p: ProfileRow) => ({
          user_id: p.user_id,
          role: p.role,
          created_at: p.created_at,
          first_name: p.first_name ?? null,
          last_name: p.last_name ?? null,
        }));
      }
    } else {
      profiles = (profilesResult.data ?? []).map((p: ProfileRow) => ({
        user_id: p.user_id,
        role: p.role,
        created_at: p.created_at,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
      }));
    }

    // Fetch auth users via Admin API to augment emails and last sign in times
    // We'll load up to 1k and map by id. Adjust as needed later with filters/pagination.
    const { data: authUsersRes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authUsers = authUsersRes?.users ?? [];
    authById = new Map(authUsers.map((u) => [u.id, u]));
  } catch (error) {
    console.error("Error initializing admin client:", error);
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users & Progress</h1>
          <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
            Back to Dashboard
          </Link>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <p className="font-semibold">Error: Missing SUPABASE_SERVICE_ROLE_KEY</p>
          <p className="text-sm mt-2">Please add the SUPABASE_SERVICE_ROLE_KEY environment variable to Vercel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users & Progress</h1>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
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
              const slug = generateUserSlug(p.first_name, p.last_name, p.user_id);
              return (
                <tr key={p.user_id}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {au?.email ?? "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {formatFullName(p.first_name, p.last_name)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {p.role}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {p.role === "client"
                        ? `${videoProgressByUser.get(p.user_id) ?? 0}%`
                        : "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {new Date(p.created_at).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${slug}`} className="block hover:text-[#63eca9] transition-colors">
                      {au?.last_sign_in_at ? new Date(au.last_sign_in_at).toLocaleString() : "—"}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-white/60">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


