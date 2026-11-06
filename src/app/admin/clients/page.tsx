import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const supabase = getSupabaseAdminClient();
  const rows = await fetchStaffPipelineRows(supabase, {
    pipelineStatuses: ["client"],
    area: "admin",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          ← Überblick
        </Link>
        <h1 className="mt-2 typo-page-title font-semibold">Klienten</h1>
        <p className="mt-1 text-sm text-white/55">
          Alle Klienten, gruppiert nach zugewiesenem Therapeuten.
        </p>
      </div>
      <StaffPeopleGroupedList
        groups={groupRowsByTherapist(rows)}
        emptyHint="Noch keine Klienten."
      />
    </div>
  );
}
