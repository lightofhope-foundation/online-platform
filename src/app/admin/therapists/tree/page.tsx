import Link from "next/link";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { fetchTherapistsWithClients } from "@/lib/adminTherapistData";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsTreePage() {
  const { supabase } = await checkAdminAccess();
  const { therapists, unassigned } = await fetchTherapistsWithClients(supabase);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zum Überblick
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Therapeuten — Strukturbaum</h1>
        <p className="text-sm text-white/60">
          Therapeut → zugewiesene Klient:innen
        </p>
      </div>

      <TherapistViewTabs active="tree" />

      <div className="space-y-4">
        {therapists.length === 0 ? (
          <p className="text-sm text-white/50">Noch keine Therapeuten angelegt.</p>
        ) : (
          therapists.map((t) => (
            <details
              key={t.user_id}
              open
              className="rounded-[20px] border border-white/10 bg-white/[0.02]"
            >
              <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-base font-medium text-white">{t.label}</span>
                    <p className="text-xs text-white/50">{t.email}</p>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                    {t.clients.length} Klient:innen
                  </span>
                </div>
              </summary>
              <div className="border-t border-white/10 px-5 py-4">
                <Link
                  href={`/admin/therapists/${t.user_id}`}
                  className="mb-3 inline-block text-xs text-[#63eca9] hover:underline"
                >
                  Therapeuten-Akte öffnen
                </Link>
                {t.clients.length === 0 ? (
                  <p className="text-sm text-white/45">Keine Zuweisungen</p>
                ) : (
                  <ul className="space-y-2 border-l border-[#63eca9]/25 pl-4">
                    {t.clients.map((c) => (
                      <li key={c.user_id} className="text-sm text-white/80">
                        {c.detail_href ? (
                          <Link href={c.detail_href} className="text-[#63eca9] hover:underline">
                            {c.label}
                          </Link>
                        ) : (
                          c.label
                        )}
                        {c.client_id ? (
                          <span className="ml-2 font-mono text-xs text-white/40">
                            {c.client_id}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))
        )}
      </div>

      {unassigned.length > 0 ? (
        <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="mb-3 text-sm font-medium text-amber-200/90">
            Ohne Therapeut ({unassigned.length})
          </h2>
          <ul className="space-y-1 text-sm text-white/70">
            {unassigned.map((c) => (
              <li key={c.user_id}>
                {c.client_id ? (
                  <Link
                    href={`/admin/users/${c.client_id.toLowerCase()}`}
                    className="text-[#63eca9] hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
