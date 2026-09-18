"use client";

import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";

export function SetterHomeTiles() {
  return (
    <MagicBentoTileGrid
      columns={2}
      tiles={[
        {
          key: "notion-leadboard",
          title: "Notion Leadboard",
          description: "Live-Anzeige Meta-Pipeline (nur Lesen)",
          href: "/setter/leadboard",
        },
        {
          key: "open-leads",
          title: "Offene Leads",
          description: "Unberührt Notion + LOH ohne Therapeut",
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
