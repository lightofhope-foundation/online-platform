"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  VideosIcon,
  SelbstcheckIcon,
  RecordingsIcon,
  HamburgerIcon,
  TherapyIcon,
  OverviewIcon,
  UsersIcon,
} from "./icons/Icons";
import { LogoutIcon } from "./icons/Icons";
import { LogoutButton } from "./LogoutButton";
import { NavPressLink } from "@/components/ui/NavPressLink";
import { resolveNavArea } from "@/lib/navConfig";

export const MobileNav: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navArea = resolveNavArea(pathname);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const active = "text-[#63eca9]";
  const mobileIconLinkClass = (href: string) =>
    `relative flex items-center justify-center p-1 ${isActive(href) ? active : ""}`;
  const mobileSpinnerClass =
    "absolute -bottom-0.5 left-1/2 -translate-x-1/2 ml-0 h-2.5 w-2.5";

  if (navArea === "admin") {
    return null;
  }

  if (navArea === "therapist") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-3xl md:hidden">
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <ul className="grid grid-cols-2 items-center justify-between px-6 py-3 text-white">
            <li className="flex items-center justify-center">
              <NavPressLink
                href="/therapist"
                aria-label="Überblick"
                className={pathname === "/therapist" ? active : ""}
                spinnerClassName={mobileSpinnerClass}
              >
                <OverviewIcon size={24} />
              </NavPressLink>
            </li>
            <li className="flex items-center justify-center">
              <NavPressLink
                href="/therapist/clients"
                aria-label="Klient:innen"
                className={pathname.startsWith("/therapist/clients") ? active : ""}
                spinnerClassName={mobileSpinnerClass}
              >
                <UsersIcon size={24} />
              </NavPressLink>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Bottom icon-only navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-3xl md:hidden">
        <div className="mx-4 mb-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          <ul className="grid grid-cols-5 items-center justify-between px-6 py-3 text-white">
            <li className="flex items-center justify-center">
              <NavPressLink
                href="/"
                aria-label="Home"
                className={mobileIconLinkClass("/")}
                spinnerClassName={mobileSpinnerClass}
              >
                <HomeIcon size={24} />
              </NavPressLink>
            </li>
            <li className="flex items-center justify-center">
              <NavPressLink
                href="/courses"
                aria-label="Videos"
                className={mobileIconLinkClass("/courses")}
                spinnerClassName={mobileSpinnerClass}
              >
                <VideosIcon size={24} />
              </NavPressLink>
            </li>
            <li className="flex items-center justify-center">
              <NavPressLink
                href="/sitzungsaufnahmen"
                aria-label="Aufnahmen"
                className={mobileIconLinkClass("/sitzungsaufnahmen")}
                spinnerClassName={mobileSpinnerClass}
              >
                <RecordingsIcon size={24} />
              </NavPressLink>
            </li>
            <li className="flex items-center justify-center">
              <button aria-label="Menü" onClick={() => setMenuOpen(true)}>
                <HamburgerIcon size={24} />
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Popup menu */}
      <div
        className={`fixed inset-0 z-30 flex items-center justify-center md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop with synced fade */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Panel with synced fade/translate */}
        <div
          className={`relative mx-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white shadow-xl transition-all duration-300 ${
            menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <button
            aria-label="Schließen"
            className="absolute right-3 top-3 px-2 py-1 text-lg leading-none bg-transparent"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
          <ul className="mt-6 space-y-3">
            <li>
              <NavPressLink
                href="/sitzungen"
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                innerClassName="w-full items-center gap-3"
                onClick={() => setMenuOpen(false)}
              >
                <TherapyIcon size={20} />
                <span>Sitzungen</span>
              </NavPressLink>
            </li>
            <li onClick={() => setMenuOpen(false)}>
              <LogoutButton className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 w-full">
                <LogoutIcon size={20} />
                <span>Ausloggen</span>
              </LogoutButton>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
