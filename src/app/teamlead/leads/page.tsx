import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function TeamleadLeadsPage() {
  const supabase = getSupabaseAdminClient();
  const rows = await fetchStaffPipelineRows(supabase, {
    pipelineStatuses: ["lead", "lost"],
    area: "teamlead",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teamlead" className="text-sm text-[#63eca9] hover:underline">
            ← Überblick
          </Link>
          <h1 className="mt-2 typo-page-title font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-white/55">
            Soft-Release-Pipeline ohne Notion-Pull.
          </p>
        </div>
        <Link
          href="/setter/leads/new"
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black"
        >
          + Neuer Lead
        </Link>
      </div>
      <StaffPeopleGroupedList
        groups={groupRowsByTherapist(rows)}
        emptyHint="Keine Leads."
        showPipelineStatus
      />
    </div>
  );
}
