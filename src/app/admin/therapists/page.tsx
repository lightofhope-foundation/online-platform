import Link from "next/link";
import { AdminTherapistsTable, type AdminTherapistRow } from "@/components/admin/AdminTherapistsTable";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { formatGermanDateTime } from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsPage() {
  const { supabase } = await checkAdminAccess();

  const { data: therapists } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, created_at")
    .eq("role", "therapist")
    .order("created_at", { ascending: true });

  const therapistIds = (therapists ?? []).map((t) => t.user_id);

  const clientCountByTherapist = new Map<string, number>();
  if (therapistIds.length > 0) {
    const { data: assignments } = await supabase
      .from("clients")
      .select("therapist_user_id")
      .in("therapist_user_id", therapistIds)
      .is("deleted_at", null);

    (assignments ?? []).forEach((row) => {
      if (!row.therapist_user_id) return;
      clientCountByTherapist.set(
        row.therapist_user_id,
        (clientCountByTherapist.get(row.therapist_user_id) ?? 0) + 1
      );
    });
  }

  const authById = new Map<string, { email?: string; last_sign_in_at?: string }>();
  if (therapistIds.length > 0) {
    const { data: authUsersRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authUsersRes?.users ?? []) {
      if (therapistIds.includes(u.id)) authById.set(u.id, u);
    }
  }

  const rows: AdminTherapistRow[] = (therapists ?? []).map((t) => {
    const au = authById.get(t.user_id);
    return {
      user_id: t.user_id,
      email: au?.email ?? "—",
      display_label: resolvePersonLabel(
        t.first_name,
        t.last_name,
        au?.email,
        t.display_alias
      ),
      display_alias: t.display_alias,
      client_count: clientCountByTherapist.get(t.user_id) ?? 0,
      last_login: formatGermanDateTime(au?.last_sign_in_at),
      detail_href: `/admin/therapists/${t.user_id}`,
    };
  });

  return (
    <div className="mx-auto w-[90%] max-w-[90vw] space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
            ← Zurück zum Überblick
          </Link>
          <h1 className="mt-2 text-xl font-semibold">Therapeuten</h1>
          <p className="text-sm text-white/60">
            Verwaltung aller Therapeuten — Zuweisungen und Strukturbaum folgen in Phase T1.
          </p>
        </div>
      </div>

      <TherapistViewTabs active="list" />

      <AdminTherapistsTable rows={rows} />
    </div>
  );
}
