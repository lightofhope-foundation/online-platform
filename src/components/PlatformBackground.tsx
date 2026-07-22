"use client";

import { useEffect, useState } from "react";
import Galaxy from "./Galaxy";
import LightRays from "./LightRays";
import Silk from "./Silk";
import { useBackgroundLayers } from "@/components/BackgroundLayersProvider";
import { LOH_ACCENT, LOH_GALAXY_HUE, LOH_SILK_COLOR } from "@/lib/branding";

function usePrefersReducedMotion() {
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

  return { mounted, reduceMotion };
}

function SilkBackground() {
  const { mounted, reduceMotion } = usePrefersReducedMotion();

  return (
    <div className="page-silk" aria-hidden>
      {mounted && !reduceMotion ? (
        <Silk
          speed={5}
          scale={0.8}
          color={LOH_SILK_COLOR}
          noiseIntensity={0}
          rotation={0}
        />
      ) : null}
    </div>
  );
}

function GalaxyBackground() {
  const { mounted, reduceMotion } = usePrefersReducedMotion();

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

/** Single app-wide background: silk + galaxy + light rays (mounted once in Providers). */
export function PlatformBackground() {
  const { layers } = useBackgroundLayers();

  return (
    <>
      {layers.silk ? <SilkBackground /> : null}
      {layers.galaxy ? <GalaxyBackground /> : null}
      {layers.lightRays ? (
        <div className="page-light-rays" aria-hidden>
          <LightRays raysColor={LOH_ACCENT} />
        </div>
      ) : null}
      {!layers.silk && !layers.galaxy ? (
        <div className="page-bg-fallback" aria-hidden />
      ) : null}
    </>
  );
}

/** @deprecated Use PlatformBackground via Providers — kept for legacy shell import parity */
export function LegacyPlatformBackground() {
  return <PlatformBackground />;
}
