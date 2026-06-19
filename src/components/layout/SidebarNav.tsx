"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LOH_LOGO_SRC, SIDEBAR_QUOTE } from "@/lib/branding";
import {
  adminNavItems,
  clientNavItems,
  therapistNavItems,
  resolveNavArea,
  isNavItemActive,
} from "@/lib/navConfig";
import { GlassNavButton, GlassNavLink } from "./GlassNavLink";
import { LogoutIcon } from "@/components/icons/Icons";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function GlassNavLogout() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  return (
    <GlassNavButton
      disabled={loading}
      aria-busy={loading}
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          await supabase.auth.signOut();
        } finally {
          router.replace("/login");
        }
      }}
    >
      <span className="text-white">
        <LogoutIcon size={18} />
      </span>
      <span>{loading ? "Loggt aus …" : "Ausloggen"}</span>
    </GlassNavButton>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const navArea = resolveNavArea(pathname);
  const navItems =
    navArea === "admin"
      ? adminNavItems
      : navArea === "therapist"
        ? therapistNavItems
        : clientNavItems;

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
          const isActive = isNavItemActive(pathname, item.href, navArea);
          return (
            <GlassNavLink
              key={item.href + item.name}
              href={item.href}
              active={isActive}
            >
              <span className="text-white">{item.icon}</span>
              <span>{item.name}</span>
            </GlassNavLink>
          );
        })}
        <GlassNavLogout />
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
