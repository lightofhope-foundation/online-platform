"use client";

import {
  useBackgroundLayers,
  type BackgroundLayers,
} from "@/components/BackgroundLayersProvider";

const TOGGLES: { key: keyof BackgroundLayers; label: string }[] = [
  { key: "galaxy", label: "Galaxy" },
  { key: "lightRays", label: "Strahlen" },
];

export function BackgroundLayerToggles() {
  const { layers, toggleLayer } = useBackgroundLayers();

  return (
    <div
      className="hidden items-center gap-1 rounded-full border border-white/12 bg-black/35 p-1 backdrop-blur-md sm:flex"
      role="group"
      aria-label="Hintergrund-Ebenen"
    >
      {TOGGLES.map(({ key, label }) => {
        const on = layers[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleLayer(key)}
            aria-pressed={on}
            title={`${label} ${on ? "aus" : "an"}`}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors",
              on
                ? "bg-[#63eca9]/20 text-[#63eca9] shadow-[0_0_12px_rgba(99,236,169,0.18)]"
                : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
