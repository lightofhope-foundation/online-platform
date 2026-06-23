"use client";

import type { ReactNode } from "react";
import { NavPressLink } from "@/components/ui/NavPressLink";
import { VideosIcon, UsersIcon, FeedbackIcon } from "@/components/icons/Icons";

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

function TileCard({ tile }: { tile: Tile }) {
  const tileClass =
    "group relative flex flex-col gap-3 rounded-[20px] border border-white/15 bg-white/[0.03] p-6 backdrop-blur-sm hover:border-white/25 hover:bg-white/[0.06]";

  const inner = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-[#63eca9]">
        {tile.icon}
      </div>
      <div>
        <h3 className="font-medium text-white">{tile.title}</h3>
        <p className="mt-1 text-sm text-white/60">{tile.description}</p>
      </div>
    </>
  );

  if (tile.disabled || !tile.href) {
    return (
      <div className={`${tileClass} cursor-not-allowed opacity-50`} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <NavPressLink
      href={tile.href}
      className={tileClass}
      innerClassName="flex-col items-stretch gap-3"
      spinnerClassName="absolute top-4 right-4"
    >
      {inner}
    </NavPressLink>
  );
}

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
      title: "Informationen",
      description: "Stammdaten des Klienten / der Patientin.",
      href: `${base}/info`,
      icon: <UsersIcon size={24} />,
      disabled: true,
    },
    {
      title: "Chat / Nachrichten",
      description: "Demnächst verfügbar.",
      icon: <FeedbackIcon size={24} />,
      disabled: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <TileCard key={tile.title} tile={tile} />
      ))}
    </div>
  );
}
