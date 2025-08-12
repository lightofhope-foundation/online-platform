"use client";

import React from "react";
import { SettingsIcon } from "./icons/Icons";

export const FabSettings: React.FC = () => {
  return (
    <button
      aria-label="Einstellungen"
      className="fixed top-4 right-4 z-20 rounded-full bg-white/10 border border-white/15 p-3 text-white backdrop-blur hover:bg-white/20 transition md:hidden"
    >
      <SettingsIcon size={20} />
    </button>
  );
};
