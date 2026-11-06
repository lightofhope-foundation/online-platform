import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function SetterLeadsPage() {
  const { supabase } = await checkSetterAccess();
  const [openLeads, lostLeads] = await Promise.all([
    fetchStaffPipelineRows(supabase, {
      pipelineStatuses: ["lead"],
      area: "setter",
    }),
    fetchStaffPipelineRows(supabase, {
      pipelineStatuses: ["lost"],
      area: "setter",
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/setter" className="text-sm text-[#63eca9] hover:underline">
            ← Überblick
          </Link>
          <h1 className="mt-2 typo-page-title font-semibold">Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Soft-Release-Pipeline in LOH — ohne Notion-Pull. Setter pflegt die Akte;
            Erstgesprächler wandelt in Klienten um oder markiert verloren.
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
