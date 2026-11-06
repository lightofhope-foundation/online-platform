import Link from "next/link";
import { SetterHomeTiles } from "@/components/setter/SetterHomeTiles";
import { checkSetterAccess } from "@/lib/checkSetterAccess";

export const dynamic = "force-dynamic";

export default async function SetterHomePage() {
  const { supabase } = await checkSetterAccess();

  const [{ count: leadCount }, { count: clientCount }] = await Promise.all([
    supabase
      .from("clients")
      .select("user_id", { count: "exact", head: true })
      .eq("pipeline_status", "lead")
      .is("deleted_at", null),
    supabase
      .from("clients")
      .select("user_id", { count: "exact", head: true })
      .eq("pipeline_status", "client")
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-section font-normal text-white">Setter & Closer</h1>
        <p className="mt-1 text-sm text-white/60">
          Soft-Release: Leads anlegen und Akten pflegen. Notion-Pipeline ist vorübergehend
          ausgeblendet (schnellere Ladezeiten). Mehrfachrollen: oben rechts umschalten.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/setter/leads"
          className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-4 transition hover:border-[#63eca9]/35"
        >
          <div className="text-sm text-white/55">Offene Leads</div>
          <div className="mt-1 text-3xl font-semibold text-white">{leadCount ?? 0}</div>
        </Link>
        <Link
          href="/setter/clients"
          className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-4 transition hover:border-[#63eca9]/35"
        >
          <div className="text-sm text-white/55">Klienten</div>
          <div className="mt-1 text-3xl font-semibold text-white">{clientCount ?? 0}</div>
        </Link>
      </div>

      <SetterHomeTiles />
    </div>
  );
}
