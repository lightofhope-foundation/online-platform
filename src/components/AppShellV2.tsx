"use client";

import { MobileNav } from "./MobileNav";
import { GlassPanel } from "./layout/GlassPanel";
import { SidebarMenuPanel } from "./layout/SidebarMenuPanel";
import { TopBar } from "./layout/TopBar";
import { UiShellToggle } from "./UiShellToggle";
import type { ShellContentWidth } from "./UiAppShell";

type AppShellV2Props = {
  children: React.ReactNode;
  contentWidth?: ShellContentWidth;
};

export function AppShellV2({
  children,
  contentWidth = "default",
}: AppShellV2Props) {
  const innerClass =
    contentWidth === "wide"
      ? "shell-v2-main-inner shell-v2-main-inner--wide"
      : "shell-v2-main-inner";

  return (
    <>
      <MobileNav />
      <UiShellToggle />

      <div className="shell-v2 relative z-10 min-h-screen text-white">
        <aside className="shell-v2-sidebar hidden lg:block">
          <SidebarMenuPanel />
        </aside>

        <div className="shell-v2-main">
          <div className={innerClass}>
            <TopBar />
            <GlassPanel className="p-6 md:p-8" as="section">
              {children}
            </GlassPanel>
          </div>
        </div>
      </div>
    </>
  );
}
