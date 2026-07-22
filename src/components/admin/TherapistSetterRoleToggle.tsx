"use client";

import { useState, useTransition } from "react";
import { adminSetTherapistSetterRole } from "@/app/admin/therapists/setter-role-actions";

type TherapistSetterRoleToggleProps = {
  userId: string;
  initialEnabled: boolean;
};

export function TherapistSetterRoleToggle({
  userId,
  initialEnabled,
}: TherapistSetterRoleToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    const next = !enabled;
    setMessage(null);
    startTransition(async () => {
      const result = await adminSetTherapistSetterRole(userId, next);
      if (result.ok) {
        setEnabled(next);
        setMessage(
          next
            ? "Setter & Closer Rolle aktiviert — Switcher erscheint oben rechts."
            : "Setter & Closer Rolle entfernt."
        );
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
      <h3 className="font-medium text-white">Zusatzrolle Setter & Closer</h3>
      <p className="mt-1 text-sm text-white/55">
        Therapeut kann zusätzlich Leads anlegen und Erstgesprächs-Akten pflegen.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={onToggle}
        className={[
          "mt-4 rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50",
          enabled
            ? "border border-red-400/40 text-red-300 hover:bg-red-500/10"
            : "bg-[#63eca9] text-black",
        ].join(" ")}
      >
        {pending ? "…" : enabled ? "Setter-Rolle entfernen" : "Als Setter & Closer freischalten"}
      </button>
      {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
    </div>
  );
}
