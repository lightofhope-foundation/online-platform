"use client";

import { isUiShellToggleVisible } from "@/lib/uiShell";
import { useUiShell } from "./UiShellProvider";

export function UiShellToggle() {
  const { version, setVersion } = useUiShell();

  if (!isUiShellToggleVisible()) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-[60] flex items-center gap-1 rounded-full border border-white/15 bg-black/80 p-1 text-xs text-white shadow-lg backdrop-blur-md md:bottom-6"
      role="group"
      aria-label="UI-Version"
    >
      <button
        type="button"
        onClick={() => setVersion("legacy")}
        className={`rounded-full px-3 py-1.5 transition ${
          version === "legacy"
            ? "bg-white/15 text-[#63eca9]"
            : "text-white/60 hover:text-white"
        }`}
      >
        Classic
      </button>
      <button
        type="button"
        onClick={() => setVersion("v2")}
        className={`rounded-full px-3 py-1.5 transition ${
          version === "v2"
            ? "bg-white/15 text-[#63eca9]"
            : "text-white/60 hover:text-white"
        }`}
      >
        Neu
      </button>
    </div>
  );
}
