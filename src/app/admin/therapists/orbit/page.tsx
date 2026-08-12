import Link from "next/link";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { fetchTherapistsWithClients } from "@/lib/adminTherapistData";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsOrbitIndexPage() {
  const { supabase } = await checkAdminAccess();
  const { therapists } = await fetchTherapistsWithClients(supabase);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zum Überblick
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Therapeuten — Orbit</h1>
        <p className="text-sm text-white/60">
          Whiteboard-Ansicht pro Therapeut: Fortschritt als Distanz zum Zentrum.
        </p>
      </div>

      <TherapistViewTabs active="orbit" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {therapists.map((t) => (
          <Link
            key={t.user_id}
            href={`/admin/therapists/${t.user_id}/orbit`}
            className="rounded-[20px] border border-white/10 bg-white/[0.02] p-5 transition hover:border-[#63eca9]/35 hover:bg-[#63eca9]/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-medium text-[#63eca9]">{t.label}</p>
                <p className="text-xs text-white/50">{t.email}</p>
              </div>
              <span className="rounded-full bg-[#63eca9]/15 px-2.5 py-0.5 text-xs text-[#63eca9]">
                {t.clients.length}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/55">Orbit öffnen →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
