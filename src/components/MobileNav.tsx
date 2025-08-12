"use client";

import React from "react";
import {
  HomeIcon,
  VideosIcon,
  SelbstcheckIcon,
  RecordingsIcon,
  HamburgerIcon,
} from "./icons/Icons";

export const MobileNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-3xl">
      <div className="mx-4 mb-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
        <ul className="grid grid-cols-5 items-center justify-between px-4 py-3 text-white">
          <li className="flex flex-col items-center gap-1">
            <a href="#" className="flex flex-col items-center text-xs opacity-90">
              <HomeIcon size={22} />
              <span className="mt-1">Home</span>
            </a>
          </li>
          <li className="flex flex-col items-center gap-1">
            <a href="#" className="flex flex-col items-center text-xs opacity-90">
              <VideosIcon size={22} />
              <span className="mt-1">Videos</span>
            </a>
          </li>
          <li className="flex flex-col items-center gap-1">
            <a href="#" className="flex flex-col items-center text-xs opacity-90">
              <SelbstcheckIcon size={22} />
              <span className="mt-1">Selbstcheck</span>
            </a>
          </li>
          <li className="flex flex-col items-center gap-1">
            <a href="#" className="flex flex-col items-center text-xs opacity-90">
              <RecordingsIcon size={22} />
              <span className="mt-1">Aufnahmen</span>
            </a>
          </li>
          <li className="flex flex-col items-center gap-1">
            <button className="flex flex-col items-center text-xs opacity-90">
              <HamburgerIcon size={22} />
              <span className="mt-1">Menü</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};
