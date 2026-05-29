"use client";

import dynamic from "next/dynamic";
import { LOH_ACCENT } from "@/lib/branding";

const LightRays = dynamic(() => import("./LightRays"), { ssr: false });
const SoftAurora = dynamic(() => import("./backgrounds/SoftAurora"), {
  ssr: false,
});

type PlatformBackgroundProps = {
  showAurora?: boolean;
};

export function PlatformBackground({ showAurora = true }: PlatformBackgroundProps) {
  return (
    <>
      <div className="page-light-rays" aria-hidden>
        <LightRays raysColor={LOH_ACCENT} />
      </div>
      {showAurora && (
        <div className="soft-aurora-band" aria-hidden>
          <SoftAurora
            speed={0.6}
            scale={2.2}
            brightness={0.5}
            color1="#ffffff"
            color2={LOH_ACCENT}
            noiseFrequency={2.5}
            noiseAmplitude={1}
            bandHeight={0.3}
            bandSpread={1}
            octaveDecay={0.1}
            layerOffset={0.2}
            colorSpeed={1}
            enableMouseInteraction={false}
          />
        </div>
      )}
    </>
  );
}

/** Legacy shell: light rays only */
export function LegacyPlatformBackground() {
  return (
    <div className="page-light-rays" aria-hidden>
      <LightRays raysColor={LOH_ACCENT} />
    </div>
  );
}
