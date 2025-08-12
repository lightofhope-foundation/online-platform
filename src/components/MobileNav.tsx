"use client";

import React from "react";
import { HomeIcon, VideosIcon, SelbstcheckIcon, RecordingsIcon, HamburgerIcon } from "./icons/Icons";

export const MobileNav: React.FC = () => {
  return (
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
            <button aria-label="Menü"><HamburgerIcon size={24} /></button>
          </li>
        </ul>
      </div>
    </nav>
  );
};
