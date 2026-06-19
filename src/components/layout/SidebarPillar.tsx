"use client";

import type { ComponentProps } from "react";
import LightPillar from "@/components/backgrounds/LightPillar";
import { LOH_PILLAR_COLOR } from "@/lib/branding";

export const SIDEBAR_PILLAR_PROPS = {
  topColor: LOH_PILLAR_COLOR,
  bottomColor: LOH_PILLAR_COLOR,
  intensity: 0.7,
  rotationSpeed: 0.2,
  glowAmount: 0.001,
  pillarWidth: 3.8,
  pillarHeight: 0.5,
  noiseIntensity: 0,
  pillarRotation: 0,
  interactive: false,
  mixBlendMode: "screen" as const,
};

type SidebarPillarProps = {
  quality?: ComponentProps<typeof LightPillar>["quality"];
};

export function SidebarPillar({ quality = "high" }: SidebarPillarProps) {
  return <LightPillar {...SIDEBAR_PILLAR_PROPS} quality={quality} />;
}
