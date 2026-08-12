"use client";

import type { ReactNode } from "react";
import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";
import { VideosIcon, UsersIcon, FeedbackIcon, CalendarIcon } from "@/components/icons/Icons";

type Tile = {
  title: string;
  description: string;
  href?: string;
  icon: ReactNode;
  disabled?: boolean;
};

export function TherapistClientTiles({ clientId }: { clientId: string }) {
  const base = `/therapist/clients/${clientId.toLowerCase()}`;
  const tiles: Tile[] = [
    {
      title: "Video-Fortschritt & Freischaltung",
      description: "Fortschritt und Freischaltzeiten für zugewiesene Klient:innen bearbeiten.",
      href: `${base}/videos`,
      icon: <VideosIcon size={24} />,
    },
    {
      title: "Sitzungsakte",
      description: "14 Sitzungen — Pfad, Notizen und Freigabe für den Klienten.",
      href: `${base}/sitzungen`,
      icon: <CalendarIcon size={24} />,
    },
    {
      title: "Therapiepfad / Überbegriff",
      description: "Phase T3 — Kategorie und Board-Reihenfolge anpassen.",
      icon: <UsersIcon size={24} />,
      disabled: true,
    },
    {
      title: "Fragebogen-Antworten",
      description: "Phase T4 — nach Fertigstellung von fragebogen-wissen.md.",
      icon: <FeedbackIcon size={24} />,
      disabled: true,
    },
  ];

  return (
    <div>
      <h2 className="typo-section mb-4 font-normal text-white">Weiterarbeiten</h2>
      <MagicBentoTileGrid
        columns={3}
        tiles={tiles.map((tile) => ({
          key: tile.title,
          title: tile.title,
          description: tile.description,
          href: tile.href,
          icon: tile.icon,
          disabled: tile.disabled,
        }))}
      />
    </div>
  );
}
