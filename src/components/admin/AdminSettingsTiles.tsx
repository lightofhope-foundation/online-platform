"use client";

import type { ReactNode } from "react";
import { NavPressLink } from "@/components/ui/NavPressLink";
import { VideosIcon, UsersIcon, SettingsIcon } from "@/components/icons/Icons";

type Tile = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

function TileCard({ tile }: { tile: Tile }) {
  return (
    <NavPressLink
      href={tile.href}
      className="group relative flex flex-col gap-3 rounded-[20px] border border-white/15 bg-white/[0.03] p-6 backdrop-blur-sm hover:border-[#63eca9]/30 hover:bg-white/[0.06]"
      innerClassName="flex-col items-stretch gap-3"
      spinnerClassName="absolute top-4 right-4"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-[#63eca9]">
        {tile.icon}
      </div>
      <div>
        <h3 className="font-medium text-white">{tile.title}</h3>
        <p className="mt-1 text-sm text-white/60">{tile.description}</p>
      </div>
    </NavPressLink>
  );
}

export function AdminSettingsTiles() {
  const base = "/admin/einstellungen";
  const tiles: Tile[] = [
    {
      title: "Mein Profil",
      description: "Anzeigename und Handynummer für Ihr Admin-Konto.",
      href: `${base}/profil`,
      icon: <UsersIcon size={24} />,
    },
    {
      title: "Videokurseinstellungen",
      description:
        "Standard-Freischaltung für alle Klienten, Stufe 0–5 und Einzelpersonen.",
      href: `${base}/videos`,
      icon: <VideosIcon size={24} />,
    },
    {
      title: "Nutzereinstellungen",
      description: "Pflichtfelder und zusätzliche Angaben bei der Registrierung.",
      href: `${base}/registrierung`,
      icon: <UsersIcon size={24} />,
    },
    {
      title: "Klienten-Stufen",
      description: "Bedeutung der Zugangsstufen 0–5 (Stufe 0 = Standard).",
      href: `${base}/levels`,
      icon: <SettingsIcon size={24} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <TileCard key={tile.href} tile={tile} />
      ))}
    </div>
  );
}
