"use client";

import type { ReactNode } from "react";
import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";
import { VideosIcon, UsersIcon, FeedbackIcon, CalendarIcon } from "@/components/icons/Icons";
import { SOFT_RELEASE } from "@/lib/softRelease";

type Tile = {
  title: string;
  description: string;
  href?: string;
  icon: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
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
      description: "Sitzungen — Pfad, Notizen und Freigabe für den Klienten.",
      href: `${base}/sitzungen`,
      icon: <CalendarIcon size={24} />,
    },
    {
      title: "Therapiepfad / Überbegriff",
      description: "Kategorie und Board-Reihenfolge anpassen.",
      icon: <UsersIcon size={24} />,
      disabled: true,
      hidden: !SOFT_RELEASE.phaseLabels,
    },
    {
      title: "Fragebogen-Antworten",
      description: "Nach Fertigstellung von fragebogen-wissen.md.",
      icon: <FeedbackIcon size={24} />,
      disabled: true,
      hidden: !SOFT_RELEASE.phaseLabels,
    },
  ];

  const visible = tiles.filter((t) => !t.hidden);

  return (
    <div>
      <h2 className="typo-section mb-4 font-normal text-white">Weiterarbeiten</h2>
      <MagicBentoTileGrid
        columns={3}
        tiles={visible.map((tile) => ({
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
