import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = getSupabaseAdminClient();
  const [openLeads, lostLeads] = await Promise.all([
    fetchStaffPipelineRows(supabase, {
      pipelineStatuses: ["lead"],
      area: "admin",
    }),
    fetchStaffPipelineRows(supabase, {
      pipelineStatuses: ["lost"],
      area: "admin",
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
            ← Überblick
          </Link>
          <h1 className="mt-2 typo-page-title font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-white/55">
            Soft-Release-Pipeline — Notion-Pulls sind ausgeblendet.
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
        groups={groupRowsByTherapist(openLeads)}
        emptyHint="Keine offenen Leads."
        showPipelineStatus
      />
      {lostLeads.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-white/70">Verloren</h2>
          <StaffPeopleGroupedList
            groups={groupRowsByTherapist(lostLeads)}
            emptyHint=""
            showPipelineStatus
          />
        </section>
      ) : null}
    </div>
  );
}
