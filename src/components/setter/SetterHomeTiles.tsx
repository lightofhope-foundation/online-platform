"use client";

import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";

export function SetterHomeTiles() {
  return (
    <MagicBentoTileGrid
      columns={2}
      tiles={[
        {
          key: "open-leads",
          title: "Offene Leads",
          description: "Nur noch nicht zugeordnete Klienten — Akte öffnen",
          href: "/setter/users",
        },
        {
          key: "new-client",
          title: "Neuer Klient",
          description: "Lead anlegen (standardmäßig ohne Therapeut)",
          href: "/setter/users/new",
        },
      ]}
    />
  );
}
