import Link from "next/link";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/AdminUsersTable";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { fetchClientTherapistMap } from "@/lib/adminTherapistData";
import { formatGermanDateTime } from "@/lib/clientId";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function SetterUsersPage() {
  const { supabase } = await checkSetterAccess();
  const accessLevels = await fetchAccessLevelOptions();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, role, created_at, first_name, last_name, client_id, access_level")
    .order("created_at", { ascending: false });

  const { data: authUsersRes } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authById = new Map((authUsersRes?.users ?? []).map((u) => [u.id, u]));
  const therapistByClient = await fetchClientTherapistMap(supabase);

  const rows: AdminUserRow[] = (profiles ?? []).map((p) => {
    const au = authById.get(p.user_id);
    const detailHref = p.client_id
      ? `/setter/users/${p.client_id.toLowerCase()}`
      : null;
    const therapist = therapistByClient.get(p.user_id);
    return {
      user_id: p.user_id,
      client_id: p.client_id,
      email: au?.email ?? "—",
      name: formatFullName(p.first_name, p.last_name),
      role: p.role,
      access_level: p.access_level ?? 0,
      video_progress: null,
      therapist_label: therapist?.label ?? null,
      therapist_href: null,
      created_at: formatGermanDateTime(p.created_at),
      last_login: formatGermanDateTime(au?.last_sign_in_at),
      detail_href: detailHref,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Klient:innen & Nutzer</h1>
          <p className="mt-1 text-sm text-white/55">Alle Plattform-Nutzer — Fokus auf Klienten-Akten</p>
        </div>
        <Link
          href="/setter/users/new"
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black"
        >
          Neuer Klient
        </Link>
      </div>
      <AdminUsersTable rows={rows} accessLevels={accessLevels} />
    </div>
  );
}
