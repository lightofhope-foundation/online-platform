"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateClientTherapistAssignment } from "@/app/admin/therapists/actions";
import type { TherapistOption } from "@/lib/adminTherapistData";

type ClientTherapistAssignmentProps = {
  clientUserId: string;
  clientId: string;
  currentTherapistUserId: string | null;
  currentTherapistLabel: string | null;
  therapists: TherapistOption[];
  revalidatePaths?: string[];
};

export function ClientTherapistAssignment({
  clientUserId,
  clientId,
  currentTherapistUserId,
  currentTherapistLabel,
  therapists,
  revalidatePaths = [],
}: ClientTherapistAssignmentProps) {
  const [selected, setSelected] = useState(currentTherapistUserId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const paths = [
    `/admin/users/${clientId.toLowerCase()}`,
    "/admin/users",
    ...revalidatePaths,
  ];

  const onSave = () => {
    setMessage(null);
    const therapistUserId = selected.length > 0 ? selected : null;
    startTransition(async () => {
      const result = await updateClientTherapistAssignment(
        clientUserId,
        therapistUserId,
        paths
      );
      if (result.ok) {
        setMessage(
          therapistUserId ? "Therapeut zugewiesen." : "Zuweisung entfernt."
        );
      } else {
        setMessage(result.error);
      }
    });
  };

  const onRemove = () => {
    setSelected("");
    setMessage(null);
    startTransition(async () => {
      const result = await updateClientTherapistAssignment(
        clientUserId,
        null,
        paths
      );
      if (result.ok) {
        setMessage("Zuweisung entfernt.");
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {currentTherapistUserId && currentTherapistLabel ? (
        <p className="text-sm text-white/70">
          Aktuell:{" "}
          <Link
            href={`/admin/therapists/${currentTherapistUserId}`}
            className="text-[#63eca9] hover:underline"
          >
            {currentTherapistLabel}
          </Link>
        </p>
      ) : (
        <p className="text-sm text-white/50">Noch kein Therapeut zugewiesen.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-white/60">Therapeut</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          >
            <option value="">— Kein Therapeut —</option>
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
          {pending ? "Speichern …" : "Zuweisen"}
        </button>
        {currentTherapistUserId ? (
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="rounded-full border border-red-500/40 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            Entfernen
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          className={`text-sm ${
            message.includes("fehlgeschlagen") || message.includes("Ungültig")
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
