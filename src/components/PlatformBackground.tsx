"use client";

import { useEffect, useState } from "react";
import Galaxy from "./Galaxy";
import LightRays from "./LightRays";
import { LOH_ACCENT, LOH_GALAXY_HUE } from "@/lib/branding";

function GalaxyBackground() {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="page-galaxy" aria-hidden>
      {mounted && !reduceMotion ? (
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={2}
          glowIntensity={0.18}
          saturation={0.5}
          hueShift={LOH_GALAXY_HUE}
          twinkleIntensity={0.06}
          rotationSpeed={0.02}
          repulsionStrength={0}
          autoCenterRepulsion={0}
          starSpeed={0.05}
          speed={0.15}
          transparent
        />
      ) : null}
    </div>
  );
}

/** Single app-wide background: galaxy + light rays (mounted once in Providers). */
export function PlatformBackground() {
  return (
    <>
      <GalaxyBackground />
      <div className="page-light-rays" aria-hidden>
        <LightRays raysColor={LOH_ACCENT} />
      </div>
    </>
  );
}

/** @deprecated Use PlatformBackground via Providers — kept for legacy shell import parity */
export function LegacyPlatformBackground() {
  return <PlatformBackground />;
}
