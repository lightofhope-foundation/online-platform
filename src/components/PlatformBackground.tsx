"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LOH_ACCENT, LOH_GALAXY_HUE } from "@/lib/branding";

const LightRays = dynamic(() => import("./LightRays"), { ssr: false });
const Galaxy = dynamic(() => import("./Galaxy"), { ssr: false });

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

  if (!mounted || reduceMotion) return null;

  return (
    <div className="page-galaxy" aria-hidden>
      <Galaxy
        mouseRepulsion={false}
        mouseInteraction={false}
        density={2.5}
        glowIntensity={0.25}
        saturation={0.65}
        hueShift={LOH_GALAXY_HUE}
        twinkleIntensity={0.12}
        rotationSpeed={0.04}
        repulsionStrength={0}
        autoCenterRepulsion={0}
        starSpeed={0.1}
        speed={0.25}
        transparent
      />
    </div>
  );
}

/** V2 shell: galaxy behind full-page light rays */
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

/** Legacy shell: galaxy behind full-page light rays */
export function LegacyPlatformBackground() {
  return (
    <>
      <GalaxyBackground />
      <div className="page-light-rays" aria-hidden>
        <LightRays raysColor={LOH_ACCENT} />
      </div>
    </>
  );
}
