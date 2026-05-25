"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsIcon } from "./icons/Icons";

export const FabSettings: React.FC = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <Link
      href="/settings"
      aria-label="Einstellungen"
      className="fixed top-4 right-4 z-20 rounded-full border border-white/15 bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20 md:hidden"
    >
      <SettingsIcon size={20} />
    </Link>
  );
};
