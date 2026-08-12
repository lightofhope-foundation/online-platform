"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setterAssignTherapist } from "@/app/setter/actions";
import type { TherapistOption } from "@/lib/adminTherapistData";

type SetterClientTherapistAssignmentProps = {
  clientUserId: string;
  currentTherapistUserId: string | null;
  currentTherapistLabel: string | null;
  therapists: TherapistOption[];
  /** After assigning a therapist, leave the open-leads list */
  redirectOnAssign?: string;
};

export function SetterClientTherapistAssignment({
  clientUserId,
  currentTherapistUserId,
  currentTherapistLabel,
  therapists,
  redirectOnAssign = "/setter/users",
}: SetterClientTherapistAssignmentProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentTherapistUserId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setMessage(null);
    const therapistUserId = selected.length > 0 ? selected : null;
    startTransition(async () => {
      const result = await setterAssignTherapist(clientUserId, therapistUserId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (therapistUserId) {
        setMessage("Zugewiesen — Lead verlässt die offenen Leads …");
        router.push(redirectOnAssign);
        router.refresh();
        return;
      }
      setMessage("Zuweisung entfernt.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {currentTherapistUserId && currentTherapistLabel ? (
        <p className="text-sm text-white/70">Aktuell: {currentTherapistLabel}</p>
      ) : (
        <p className="text-sm text-white/50">
          Noch kein Therapeut — Lead bleibt in der Setter-Pipeline, bis du zuweist.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-white/60">Therapeut</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          >
            <option value="">— Noch nicht zuordnen —</option>
            {therapists.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.label}
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
          {pending ? "Speichern …" : "Therapeut zuweisen"}
        </button>
      </div>

      {message ? (
        <p
          className={`text-sm ${
            message.toLowerCase().includes("fehl") || message.toLowerCase().includes("ungültig")
              ? "text-red-400"
              : "text-[#63eca9]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
