"use client";

import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";

export function SetterHomeTiles() {
  return (
    <MagicBentoTileGrid
      columns={2}
      tiles={[
        {
          key: "leads",
          title: "Leads",
          description: "Pipeline-Leads anlegen und Akten bearbeiten",
          href: "/setter/leads",
        },
        {
          key: "clients",
          title: "Klienten",
          description: "Alle Klienten, gruppiert nach zugewiesenem Therapeuten",
          href: "/setter/clients",
        },
        {
          key: "new-lead",
          title: "Neuer Lead",
          description: "Lead anlegen (noch kein Klient, kein Therapeut)",
          href: "/setter/leads/new",
        },
      ]}
    />
  );
}
