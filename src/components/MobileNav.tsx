"use client";

import React, { useState } from "react";
import {
  HomeIcon,
  VideosIcon,
  SelbstcheckIcon,
  RecordingsIcon,
  HamburgerIcon,
  FeedbackIcon,
  TherapyIcon,
  LogoutIcon,
} from "./icons/Icons";

export const MobileNav: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Bottom icon-only navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-3xl md:hidden">
        <div className="mx-4 mb-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          <ul className="grid grid-cols-5 items-center justify-between px-6 py-3 text-white">
            <li className="flex items-center justify-center">
              <a href="#" aria-label="Home"><HomeIcon size={24} /></a>
            </li>
            <li className="flex items-center justify-center">
              <a href="#" aria-label="Videos"><VideosIcon size={24} /></a>
            </li>
            <li className="flex items-center justify-center">
              <a href="#" aria-label="Selbstcheck"><SelbstcheckIcon size={24} /></a>
            </li>
            <li className="flex items-center justify-center">
              <a href="#" aria-label="Aufnahmen"><RecordingsIcon size={24} /></a>
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
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                onClick={() => setMenuOpen(false)}
              >
                <FeedbackIcon size={20} />
                <span>Feedback</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                onClick={() => setMenuOpen(false)}
              >
                <TherapyIcon size={20} />
                <span>1:1 Therapie</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                onClick={() => setMenuOpen(false)}
              >
                <LogoutIcon size={20} />
                <span>Ausloggen</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
