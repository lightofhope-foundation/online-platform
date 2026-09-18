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

type AdminUserTilesProps = {
  clientId: string;
  role: string;
};

export function AdminUserTiles({ clientId, role }: AdminUserTilesProps) {
  if (role !== "client") {
    return null;
  }

  const base = `/admin/users/${clientId}`;
  const tiles: Tile[] = [
    {
      title: "Video-Fortschritt & Freischaltung",
      description: "Fortschritt, Freischaltzeiten und letzter Login verwalten.",
      href: `${base}/videos`,
      icon: <VideosIcon size={24} />,
    },
    {
      title: "Sitzungsakte",
      description: "14 Sitzungen — Pfad, Notizen, Freigabe und Änderungsverlauf.",
      href: `${base}/sitzungen`,
      icon: <CalendarIcon size={24} />,
    },
    {
      title: "Informationen",
      description: "Stammdaten des Klienten / der Patientin.",
      href: `${base}/info`,
      icon: <UsersIcon size={24} />,
    },
    {
      title: "Chat / Nachrichten",
      description: "Demnächst verfügbar.",
      icon: <FeedbackIcon size={24} />,
      disabled: true,
    },
  ];

  return (
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
  );
}
