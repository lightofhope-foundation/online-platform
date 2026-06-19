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

export function SidebarMenuPanel() {
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
    <GlassPanel
      className="shell-sidebar-panel relative flex h-full flex-col overflow-hidden p-0"
      as="div"
    >
      {mounted && !reduceMotion && (
        <div className="sidebar-light-pillar" aria-hidden>
          <SidebarPillar quality="high" />
        </div>
      )}
      <div className="relative z-10 flex h-full flex-col p-6 sidebar-nav-content">
        <SidebarNav />
      </div>
    </GlassPanel>
  );
}
