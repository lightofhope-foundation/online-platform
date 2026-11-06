"use client";

import Link from "next/link";
import type { TherapistClientBoardItem } from "@/lib/therapistClients";

function ClientCard({ item }: { item: TherapistClientBoardItem }) {
  const initial = item.name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <Link
      href={item.href}
      className="group flex flex-col rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 transition hover:border-[#63eca9]/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-black ${
            item.archived
              ? "bg-[#d4b84a]"
              : item.accessRevoked
                ? "bg-[#e8a04a]"
                : "bg-[#63eca9]"
          }`}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white group-hover:text-[#63eca9]">
            {item.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/40">{item.clientId}</div>
          <div className="mt-2 text-[11px] uppercase tracking-wide text-white/35">
            {item.accessRevoked ? "ohne Zugang" : item.archived ? "archiviert" : "aktiv"}
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs text-[#63eca9]/80 opacity-0 transition group-hover:opacity-100">
        Akte öffnen →
      </div>
    </Link>
  );
}

type Props = {
  active: TherapistClientBoardItem[];
  archived: TherapistClientBoardItem[];
};

export function TherapistClientsBoard({ active, archived }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Klientenakte</p>
        <h1 className="mt-1 typo-clients-heading text-white">Meine Klient:innen</h1>
        <p className="mt-2 text-sm text-white/50">
          Aktuelle und archivierte Klient:innen — Klick öffnet die Akte.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/55">Aktiv ({active.length})</h2>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/40">
            Noch keine aktiven Klient:innen zugewiesen.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((item) => (
              <ClientCard key={item.userId} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/55">
          Archiviert ({archived.length})
        </h2>
        {archived.length === 0 ? (
          <p className="text-sm text-white/40">Keine archivierten Klient:innen.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((item) => (
              <ClientCard key={item.userId} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
