"use client";

import { MobileNav } from "./MobileNav";
import { PlatformBackground } from "./PlatformBackground";
import { GlassPanel } from "./layout/GlassPanel";
import { SidebarMenuPanel } from "./layout/SidebarMenuPanel";
import { TopBar } from "./layout/TopBar";
import { UiShellToggle } from "./UiShellToggle";

type AppShellV2Props = {
  children: React.ReactNode;
};

export function AppShellV2({ children }: AppShellV2Props) {
  return (
    <>
      <PlatformBackground />
      <MobileNav />
      <UiShellToggle />

      <div className="shell-v2 relative z-10 min-h-screen text-white">
        <aside className="shell-v2-sidebar hidden lg:block">
          <SidebarMenuPanel />
        </aside>

        <div className="shell-v2-main">
          <div className="shell-v2-main-inner">
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
