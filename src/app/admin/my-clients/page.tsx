import Link from "next/link";
import { StaffPeopleGroupedList } from "@/components/staff/StaffPeopleGroupedList";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  fetchStaffPipelineRows,
  groupRowsByTherapist,
} from "@/lib/staffClientsData";

export const dynamic = "force-dynamic";

export default async function AdminMyClientsPage() {
  const user = await getAuthUserFromCookie();
  const supabase = getSupabaseAdminClient();
  const rows = user
    ? await fetchStaffPipelineRows(supabase, {
        pipelineStatuses: ["client"],
        area: "admin",
        onlyTherapistUserId: user.id,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          ← Überblick
        </Link>
        <h1 className="mt-2 typo-page-title font-semibold">Meine Klienten</h1>
        <p className="mt-1 text-sm text-white/55">
          Klienten, die dir persönlich als Therapeut zugewiesen sind.
        </p>
      </div>
      <StaffPeopleGroupedList
        groups={groupRowsByTherapist(rows)}
        emptyHint="Dir sind derzeit keine Klienten zugewiesen."
      />
    </div>
  );
}
