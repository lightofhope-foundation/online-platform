"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignLeadToErstgespraechler } from "@/app/setter/actions";

export type EgOption = { user_id: string; label: string };

type Props = {
  clientUserId: string;
  currentEgUserId: string | null;
  currentEgLabel: string | null;
  options: EgOption[];
};

export function LeadEgAssignment({
  clientUserId,
  currentEgUserId,
  currentEgLabel,
  options,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentEgUserId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await assignLeadToErstgespraechler(
        clientUserId,
        selected || null
      );
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(selected ? "Erstgesprächler zugewiesen." : "Zuweisung entfernt.");
      router.refresh();
    });
  };

  return (
    <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
      <h2 className="mb-1 text-lg font-medium text-white">Erstgesprächler zuweisen</h2>
      <p className="mb-4 text-sm text-white/50">
        Der Lead erscheint dann unter „Zugewiesene Leads“ in der EG-Ansicht.
      </p>
      {currentEgUserId && currentEgLabel ? (
        <p className="mb-3 text-sm text-white/70">Aktuell: {currentEgLabel}</p>
      ) : (
        <p className="mb-3 text-sm text-white/50">Noch keinem Erstgesprächler zugewiesen.</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-white/60">Erstgesprächler</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          >
            <option value="">— Nicht zuordnen —</option>
            {options.map((o) => (
              <option key={o.user_id} value={o.user_id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {pending ? "Speichern …" : "Zuweisen"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[#63eca9]">{message}</p> : null}
    </section>
  );
}
