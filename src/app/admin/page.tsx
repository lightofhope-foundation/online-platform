import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import {
  AdminDashboardOverview,
  buildAdminDashboardLabel,
} from "@/components/admin/AdminDashboardOverview";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  let progressCount = 0;
  let userCount = 0;
  let clientCount = 0;
  let therapistCount = 0;
  let courses: { id: string; title: string; slug: string }[] = [];
  let adminLabel = "Admin";

  try {
    const supabase = getSupabaseAdminClient();
    const authUser = await getAuthUserFromCookie();

    if (authUser) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", authUser.id)
        .maybeSingle();

      adminLabel = buildAdminDashboardLabel(
        adminProfile?.first_name ?? null,
        adminProfile?.last_name ?? null,
        authUser.email
      );
    }

    const [progressResult, profilesResult, coursesResult] = await Promise.all([
      supabase.from("video_progress").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("role"),
      supabase
        .from("courses")
        .select("id,title,slug")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(8),
    ]);

    progressCount = progressResult.count ?? 0;
    courses = coursesResult.data ?? [];

    const profiles = profilesResult.data ?? [];
    userCount = profiles.length;
    clientCount = profiles.filter((p) => p.role === "client").length;
    therapistCount = profiles.filter((p) => p.role === "therapist").length;
  } catch (error) {
    console.error("Error initializing admin client:", error);
  }

  return (
    <AdminDashboardOverview
      stats={{
        adminLabel,
        courseCount: courses.length,
        userCount,
        clientCount,
        therapistCount,
        progressCount,
        courses,
      }}
    />
  );
}
