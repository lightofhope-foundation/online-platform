"use client";

import React from "react";
import LightRays from "./LightRays";
import { FabSettings } from "./FabSettings";
import { MobileNav } from "./MobileNav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  VideosIcon,
  RecordingsIcon,
  SelbstcheckIcon,
  FeedbackIcon,
  TherapyIcon,
  SettingsIcon,
  LogoutIcon,
} from "./icons/Icons";
import { LogoutButton } from "./LogoutButton";

type AppShellProps = {
  title?: string;
  children: React.ReactNode;
};

export const AppShell: React.FC<AppShellProps> = ({ title, children }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const activeClasses =
    "bg-gradient-to-r from-[#63eca9]/20 to-[#63eca9]/10 border-[#63eca9]/50 shadow-[0_0_20px_rgba(99,236,169,0.4)]";

  return (
    <>
      <div className="page-light-rays">
        <LightRays raysColor="#63eca9" />
      </div>

      <FabSettings />
      <MobileNav />

      <main className="relative z-10 min-h-screen text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {title ? (
            <div className="mb-12 text-center">
              <div className="inline-block rounded-[28px] border border-white/10 bg-white/[0.02] px-8 py-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <aside className="sticky top-6 self-start rounded-[24px] border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hidden lg:block">
              <nav className="space-y-4 text-white/90">
                {[
                  { name: "Startseite", href: "/", icon: <HomeIcon size={18} /> },
                  { name: "Video-Section", href: "/courses", icon: <VideosIcon size={18} /> },
                  { name: "Sitzungsaufnahmen", href: "#", icon: <RecordingsIcon size={18} /> },
                  { name: "Selbstcheck", href: "#", icon: <SelbstcheckIcon size={18} /> },
                  { name: "Feedback", href: "#", icon: <FeedbackIcon size={18} /> },
                  { name: "1:1 Therapie", href: "#", icon: <TherapyIcon size={18} /> },
                  { name: "Einstellungen", href: "#", icon: <SettingsIcon size={18} /> },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm transition-all hover:bg-white/[0.08] ${
                      isActive(item.href) ? activeClasses : ""
                    }`}
                  >
                    <span className="text-white">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
                <LogoutButton className="">
                  <span className="text-white"><LogoutIcon size={18} /></span>
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
};

export default AppShell;


