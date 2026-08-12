"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { SidebarNav } from "./SidebarNav";

const SidebarPillar = dynamic(
  () =>
    import("./SidebarPillar").then((mod) => ({ default: mod.SidebarPillar })),
  { ssr: false, loading: () => null }
);

/** Inline backdrop override — LightningCSS strips `backdrop-filter: none` from CSS. */
const SIDEBAR_PANEL_STYLE = {
  background: "transparent",
  backdropFilter: "blur(0px)",
  WebkitBackdropFilter: "blur(0px)",
} as const;

export function SidebarMenuPanel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <GlassPanel
      className="shell-sidebar-panel relative flex h-full flex-col overflow-hidden p-0"
      style={SIDEBAR_PANEL_STYLE}
      as="div"
    >
      {mounted ? (
        <div className="sidebar-light-pillar" aria-hidden>
          <SidebarPillar quality="high" />
        </div>
      ) : null}
      <div className="relative z-10 flex h-full flex-col p-6 sidebar-nav-content">
        <SidebarNav />
      </div>
    </GlassPanel>
  );
}
