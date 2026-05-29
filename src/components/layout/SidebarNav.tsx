"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOH_LOGO_SRC, SIDEBAR_QUOTE } from "@/lib/branding";
import {
  adminNavItems,
  clientNavItems,
  isNavItemActive,
} from "@/lib/navConfig";
import { LogoutButton } from "@/components/LogoutButton";
import { LogoutIcon } from "@/components/icons/Icons";

export function SidebarNav() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const navItems = isAdminRoute ? adminNavItems : clientNavItems;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex justify-center px-2 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOH_LOGO_SRC}
          alt="Light of Hope Foundation"
          className="h-auto w-[min(180px,90%)] max-h-[72px] object-contain"
        />
      </div>

      <nav className="flex-1 space-y-3 text-white/90">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href, isAdminRoute);
          return (
            <Link
              key={item.href + item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm transition-all hover:border-[#63eca9]/50 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(99,236,169,0.3)] ${
                isActive
                  ? "border-[#63eca9]/50 bg-gradient-to-r from-[#63eca9]/20 to-[#63eca9]/20 shadow-[0_0_20px_rgba(99,236,169,0.4)]"
                  : ""
              }`}
            >
              <span className="text-white">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
        <LogoutButton className="w-full">
          <span className="text-white">
            <LogoutIcon size={18} />
          </span>
          <span>Ausloggen</span>
        </LogoutButton>
      </nav>

      <footer className="mt-8 space-y-3 border-t border-white/10 pt-6">
        <div className="flex justify-center opacity-90">
          {/* Tree slot — LOH logo placeholder until PNG delivered */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOH_LOGO_SRC}
            alt=""
            aria-hidden
            className="h-auto w-[min(200px,85%)] max-h-[100px] object-contain"
          />
        </div>
        <p className="text-center text-xs leading-relaxed text-white/50">
          {SIDEBAR_QUOTE}
        </p>
      </footer>
    </div>
  );
}
