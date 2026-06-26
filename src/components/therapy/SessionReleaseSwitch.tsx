"use client";

import { useEffect, useId, useState, useTransition } from "react";

type SessionReleaseSwitchProps = {
  released: boolean;
  disabled?: boolean;
  onChange: (released: boolean) => Promise<unknown>;
  label?: string;
};

export function SessionReleaseSwitch({
  released,
  disabled,
  onChange,
  label = "Für Klient freigeben",
}: SessionReleaseSwitchProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(released);
  const inputId = useId();

  useEffect(() => {
    setOptimistic(released);
  }, [released]);

  const active = optimistic;
  const isDisabled = disabled || pending;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-3 ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span className="text-sm text-white/70">{label}</span>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={active}
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) return;
          const next = !active;
          setOptimistic(next);
          startTransition(async () => {
            try {
              await onChange(next);
            } catch {
              setOptimistic(active);
            }
          });
        }}
        className={`relative h-7 w-12 rounded-full border transition-all duration-300 ${
          active
            ? "border-[#63eca9]/60 bg-[#63eca9]/25"
            : "border-white/20 bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
            active ? "translate-x-5 bg-[#63eca9]" : "translate-x-0"
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${active ? "text-[#63eca9]" : "text-white/40"}`}>
        {active ? "Freigegeben" : "Gesperrt"}
      </span>
    </label>
  );
}
