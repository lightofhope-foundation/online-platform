"use client";

import { usePathname } from "next/navigation";
import { FabSettings } from "./FabSettings";
import { MobileNav } from "./MobileNav";
import { LogoutButton } from "./LogoutButton";
import { LogoutIcon } from "./icons/Icons";
import { NavPressLink } from "@/components/ui/NavPressLink";
import {
  adminNavItems,
  clientNavItems,
  therapistNavItems,
  resolveNavArea,
  isNavItemActive,
} from "@/lib/navConfig";
import { UiShellToggle } from "./UiShellToggle";
import type { ShellContentWidth } from "./UiAppShell";

type AppShellLegacyProps = {
  children: React.ReactNode;
  contentWidth?: ShellContentWidth;
};

export function AppShellLegacy({
  children,
  contentWidth = "default",
}: AppShellLegacyProps) {
  const pathname = usePathname();
  const navArea = resolveNavArea(pathname);
  const desktopNavItems =
    navArea === "admin"
      ? adminNavItems
      : navArea === "therapist"
        ? therapistNavItems
        : clientNavItems;

  const mainMaxWidth =
    contentWidth === "wide" ? "max-w-none w-full" : "max-w-7xl";

  return (
    <>
      <FabSettings />
      <MobileNav />
      <UiShellToggle />

      <main className="relative z-10 min-h-screen text-white">
        <div className={`mx-auto ${mainMaxWidth} px-6 py-10`}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="sticky top-6 hidden self-start rounded-[24px] border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm lg:block">
              <nav className="space-y-4 text-white/90">
                {desktopNavItems.map((item) => {
                  const isActive = isNavItemActive(
                    pathname,
                    item.href,
                    navArea
                  );
                  return (
                    <NavPressLink
                      key={item.href + item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm hover:border-[#63eca9]/50 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(99,236,169,0.3)] ${
                        isActive
                          ? "border-[#63eca9]/50 bg-gradient-to-r from-[#63eca9]/20 to-[#63eca9]/20 shadow-[0_0_20px_rgba(99,236,169,0.4)]"
                          : ""
                      }`}
                    >
                      <span className="text-white">{item.icon}</span>
                      <span>{item.name}</span>
                    </NavPressLink>
                  );
                })}
                <LogoutButton className="w-full">
                  <span className="text-white">
                    <LogoutIcon size={18} />
                  </span>
                  <span>Ausloggen</span>
                </LogoutButton>
              </nav>
            </aside>

            <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
              {children}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
