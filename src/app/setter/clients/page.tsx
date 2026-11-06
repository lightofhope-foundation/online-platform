import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function SetterAllClientsPage() {
  const { supabase } = await checkSetterAccess();
  const rows = await fetchStaffPipelineRows(supabase, {
    pipelineStatuses: ["client"],
    area: "setter",
  });
  const groups = groupRowsByTherapist(rows);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/setter" className="text-sm text-[#63eca9] hover:underline">
          ← Überblick
        </Link>
        <h1 className="mt-2 typo-page-title font-semibold">Klienten</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Alle Klienten (keine Leads), sortiert nach zugewiesenem Therapeuten. Akte öffnen
          über die Zeile oder die globale Suche.
        </p>
      </div>
      <StaffPeopleGroupedList
        groups={groups}
        emptyHint="Noch keine Klienten in der Pipeline."
      />
    </div>
  );
}
