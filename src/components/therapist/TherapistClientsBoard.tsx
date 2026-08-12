"use client";

import Link from "next/link";
import type { TherapistClientBoardItem } from "@/lib/therapistClients";
import { accentClass } from "@/lib/leadVault";

function BoardGlyph({ archived }: { archived?: boolean }) {
  if (archived) {
    return (
      <svg viewBox="0 0 24 24" className="h-9 w-9 text-black/65" fill="currentColor">
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-black/65" fill="currentColor">
      <path d="M9 3h6a1 1 0 0 1 1 1v1h1.5A1.5 1.5 0 0 1 19 6.5v13A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5H8V4a1 1 0 0 1 1-1Zm0 2v1h6V5H9Zm3 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    </svg>
  );
}

function ClientIcon({ item }: { item: TherapistClientBoardItem }) {
  return (
    <Link
      href={item.href}
      className="flex w-[120px] flex-col items-center gap-2 transition hover:scale-[1.03]"
    >
      <div
        className={`flex h-[88px] w-[88px] items-center justify-center rounded-2xl shadow-md ${accentClass(item.accent)}`}
      >
        <BoardGlyph archived={item.archived} />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-white/90">{item.name}</div>
        <div className="text-xs text-white/45">
          {item.accessRevoked ? "ohne Zugang" : "Klient"}
        </div>
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

      <div
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#1a1d22]/85 p-6 sm:p-8"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/50">
            Aktiv ({active.length})
          </h2>
          {active.length === 0 ? (
            <p className="text-sm text-white/40">Noch keine aktiven Klient:innen zugewiesen.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {active.map((item) => (
                <ClientIcon key={item.userId} item={item} />
              ))}
            </div>
          )}
        </section>

        <div className="my-8 border-t border-white/10" />

        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/50">
            Archiviert ({archived.length})
          </h2>
          {archived.length === 0 ? (
            <p className="text-sm text-white/40">Keine archivierten Klient:innen.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {archived.map((item) => (
                <ClientIcon key={item.userId} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
