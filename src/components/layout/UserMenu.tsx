"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { formatDisplayName, formatInitials, resolvePersonLabel } from "@/lib/formatDisplayName";
import { useUserProfile } from "@/hooks/useUserProfile";
import { resolveNavArea } from "@/lib/navConfig";

export function UserMenu() {
  const pathname = usePathname();
  const navArea = resolveNavArea(pathname);
  const settingsHref =
    navArea === "admin"
      ? "/admin/einstellungen/profil"
      : navArea === "therapist"
        ? "/therapist/settings"
        : "/settings";
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = resolvePersonLabel(
    profile?.firstName,
    profile?.lastName,
    profile?.email,
    profile?.displayAlias
  );
  const initials = formatInitials(
    profile?.firstName,
    profile?.lastName,
    profile?.email
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-sm text-white transition hover:border-[#63eca9]/40 hover:bg-white/[0.08]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63eca9]/20 text-xs font-semibold text-[#63eca9]">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {displayName}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-white/60 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-xl backdrop-blur-md"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            {profile?.email && (
              <p className="truncate text-xs text-white/50">{profile.email}</p>
            )}
          </div>
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-white/90 transition hover:bg-white/[0.06]"
          >
            Einstellungen
          </Link>
          <LogoutButton className="w-full justify-start rounded-none border-0 border-t border-white/10 bg-transparent px-4 py-3 text-sm hover:bg-white/[0.06]">
            Ausloggen
          </LogoutButton>
        </div>
      )}
    </div>
  );
}
