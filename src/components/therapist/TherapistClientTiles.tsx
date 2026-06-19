import type { ReactNode } from "react";
import { VideosIcon, UsersIcon, FeedbackIcon } from "@/components/icons/Icons";

type Tile = {
  title: string;
  description: string;
  icon: ReactNode;
};

function TileCard({ tile }: { tile: Tile }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[20px] border border-white/15 bg-white/[0.03] p-6 opacity-50 backdrop-blur-sm"
      aria-disabled
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-[#63eca9]">
        {tile.icon}
      </div>
      <div>
        <h3 className="font-medium text-white">{tile.title}</h3>
        <p className="mt-1 text-sm text-white/60">{tile.description}</p>
      </div>
    </div>
  );
}

export function TherapistClientTiles({ clientId }: { clientId: string }) {
  void clientId;
  const tiles: Tile[] = [
    {
      title: "Video-Fortschritt & Freischaltung",
      description: "Phase T2 — Freischaltzeiten bearbeiten (ohne Video-CMS).",
      icon: <VideosIcon size={24} />,
    },
    {
      title: "Therapiepfad / Überbegriff",
      description: "Phase T2 — Kategorie und Board-Reihenfolge anpassen.",
      icon: <UsersIcon size={24} />,
    },
    {
      title: "Fragebogen-Antworten",
      description: "Phase Q3 — nach Fertigstellung von fragebogen-wissen.md.",
      icon: <FeedbackIcon size={24} />,
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Akte</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <TileCard key={tile.title} tile={tile} />
        ))}
      </div>
    </div>
  );
}
