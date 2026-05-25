"use client";

import { useRef } from "react";
import { CalendarIcon } from "@/components/icons/Icons";

type UnlockDatetimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export function UnlockDatetimeField({
  value,
  onChange,
  ariaLabel,
}: UnlockDatetimeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // showPicker can throw if not triggered by user gesture in some browsers
      }
    }
    input.click();
  };

  return (
    <div className="relative min-w-[210px] flex-1">
      <input
        ref={inputRef}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-black/40 py-2 pl-3 pr-11 text-sm text-white outline-none focus:border-[#63eca9]/50 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-[#63eca9] transition-colors hover:border-[#63eca9]/40 hover:bg-[#63eca9]/10"
        aria-label="Kalender öffnen"
        title="Datum und Uhrzeit wählen"
      >
        <CalendarIcon size={16} />
      </button>
    </div>
  );
}
