"use client";

import type { ReactNode } from "react";
import { MagicBentoCard, MagicBentoGrid } from "@/components/react-bits/MagicBento";

export type MagicBentoTile = {
  key: string;
  title: string;
  description?: string;
  label?: string;
  href?: string | null;
  icon?: ReactNode;
  stat?: string | number;
  disabled?: boolean;
};

type MagicBentoTileGridProps = {
  tiles: MagicBentoTile[];
  columns?: 2 | 3 | 4;
  className?: string;
};

/** App tile grid with React Bits Magic Bento effects (LOH brand glow). */
export function MagicBentoTileGrid({
  tiles,
  columns = 3,
  className = "",
}: MagicBentoTileGridProps) {
  return (
    <MagicBentoGrid columns={columns} layout="uniform" className={className}>
      {tiles.map((tile) => (
        <MagicBentoCard
          key={tile.key}
          title={tile.title}
          description={tile.description}
          label={tile.label}
          href={tile.href}
          icon={tile.icon}
          stat={tile.stat}
          disabled={tile.disabled}
        />
      ))}
    </MagicBentoGrid>
  );
}
