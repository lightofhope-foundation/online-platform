import Link from "next/link";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { fetchTherapistsWithClients } from "@/lib/adminTherapistData";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsBoardPage() {
  const { supabase } = await checkAdminAccess();
  const { therapists, unassigned } = await fetchTherapistsWithClients(supabase);

  return (
    <div className="mx-auto w-[90%] max-w-[90vw] space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zum Überblick
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Therapeuten — Übersicht</h1>
        <p className="text-sm text-white/60">
          Karten pro Therapeut mit Klient:innen und offene Zuweisungen
        </p>
      </div>

      <TherapistViewTabs active="board" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {therapists.map((t) => (
          <div
            key={t.user_id}
            className="flex flex-col rounded-[20px] border border-white/10 bg-white/[0.02] p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/therapists/${t.user_id}`}
                  className="text-base font-medium text-[#63eca9] hover:underline"
                >
                  {t.label}
                </Link>
                <p className="text-xs text-white/50">{t.email}</p>
              </div>
              <span className="rounded-full bg-[#63eca9]/15 px-2.5 py-0.5 text-xs text-[#63eca9]">
                {t.clients.length}
              </span>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm text-white/75">
              {t.clients.length === 0 ? (
                <li className="text-white/40">—</li>
              ) : (
                t.clients.map((c) => (
                  <li key={c.user_id}>
                    {c.detail_href ? (
                      <Link href={c.detail_href} className="hover:text-[#63eca9]">
                        {c.label}
                      </Link>
                    ) : (
                      c.label
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}

        <div className="flex flex-col rounded-[20px] border border-amber-500/25 bg-amber-500/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium text-amber-100/90">Ohne Therapeut</h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs text-amber-200">
              {unassigned.length}
            </span>
          </div>
          <ul className="flex-1 space-y-1.5 text-sm text-white/75">
            {unassigned.length === 0 ? (
              <li className="text-white/40">Alle zugewiesen</li>
            ) : (
              unassigned.map((c) => (
                <li key={c.user_id}>
                  {c.client_id ? (
                    <Link
                      href={`/admin/users/${c.client_id.toLowerCase()}`}
                      className="hover:text-[#63eca9]"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    c.label
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
