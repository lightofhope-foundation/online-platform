import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

/** EG-Kontext: gleiche Klienten-Liste, ohne Setter-Rollenwechsel */
export default async function ErstgespraechlerClientsPage() {
  const { supabase } = await checkSetterAccess();
  const rows = await fetchStaffPipelineRows(supabase, {
    pipelineStatuses: ["client"],
    area: "setter",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/setter/eg" className="text-sm text-[#63eca9] hover:underline">
          ← Zugewiesene Leads
        </Link>
        <h1 className="mt-2 typo-page-title font-semibold">Klienten</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Alle Klienten, gruppiert nach Therapeut — Ansicht Erstgesprächler.
        </p>
      </div>
      <StaffPeopleGroupedList
        groups={groupRowsByTherapist(rows)}
        emptyHint="Noch keine Klienten."
      />
    </div>
  );
}
