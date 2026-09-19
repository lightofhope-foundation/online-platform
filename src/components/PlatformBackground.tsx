"use client";

import { useEffect, useState } from "react";
import Galaxy from "./Galaxy";
import LightRays from "./LightRays";
import { BackgroundErrorBoundary } from "@/components/BackgroundErrorBoundary";
import { useBackgroundLayers } from "@/components/BackgroundLayersProvider";
import { LOH_ACCENT, LOH_GALAXY_HUE } from "@/lib/branding";

function useClientMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** iPhone/iPad Safari often crashes with dual WebGL canvases — use CSS fallback there. */
function useLiteBackground() {
  const [lite, setLite] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px), (pointer: coarse)");
    const sync = () => setLite(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return lite;
}

function GalaxyBackground() {
  const mounted = useClientMounted();

  return (
    <div className="page-galaxy" aria-hidden>
      {mounted ? (
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
  const { layers } = useBackgroundLayers();
  const lite = useLiteBackground();
  const mounted = useClientMounted();

  // Mobile / touch: no WebGL — dual ogl contexts crash iOS Safari (black screen + client error).
  if (lite) {
    return <div className="page-bg-fallback" aria-hidden />;
  }

  return (
    <BackgroundErrorBoundary>
      {layers.galaxy ? <GalaxyBackground /> : null}
      {layers.lightRays && mounted ? (
        <div className="page-light-rays" aria-hidden>
          <LightRays raysColor={LOH_ACCENT} />
        </div>
      ) : null}
      {!layers.galaxy ? <div className="page-bg-fallback" aria-hidden /> : null}
    </BackgroundErrorBoundary>
  );
}

/** @deprecated Use PlatformBackground via Providers — kept for legacy shell import parity */
export function LegacyPlatformBackground() {
  return <PlatformBackground />;
}
