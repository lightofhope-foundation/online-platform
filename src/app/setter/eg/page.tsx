import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";
import { userHasPortalRole } from "@/lib/userRoles";

export const dynamic = "force-dynamic";

/**
 * Erstgesprächler: nur zugewiesene Leads — kein Setter-Rollenwechsel, kein Neuer Lead.
 */
export default async function ErstgespraechlerHomePage() {
  const { user, supabase, roles } = await checkSetterAccess();
  const isAdminOrTl =
    userHasPortalRole(roles, "admin") || userHasPortalRole(roles, "teamlead");

  const raw = await fetchStaffPipelineRows(supabase, {
    pipelineStatuses: ["lead"],
    area: "setter",
    onlyErstgespraechlerUserId: isAdminOrTl ? undefined : user.id,
  });
  const rows = raw.map((r) => ({
    ...r,
    detail_href: r.detail_href.includes("?")
      ? `${r.detail_href}&view=eg`
      : `${r.detail_href}?view=eg`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#63eca9]/80">
          Ansicht Erstgesprächler
        </p>
        <h1 className="typo-section mt-1 font-normal text-white">
          Zugewiesene Leads
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Nur Leads, die dir vom Setter zugewiesen wurden. Akte füllen und Therapeut
          zuweisen. Neue Leads und Lead→Klient macht der Setter.
        </p>
      </div>

      <StaffPeopleGroupedList
        groups={groupRowsByTherapist(rows)}
        emptyHint="Dir sind aktuell keine Leads zugewiesen."
        showPipelineStatus
      />

      <p className="text-xs text-white/35">
        Alle Klienten:{" "}
        <Link href="/setter/eg/clients" className="text-[#63eca9] hover:underline">
          öffnen
        </Link>
      </p>
    </div>
  );
}
