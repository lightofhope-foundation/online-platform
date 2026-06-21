"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateClientTherapistAssignment } from "@/app/admin/therapists/actions";
import type { ClientOption } from "@/lib/adminTherapistData";

type TherapistClientAssignmentPanelProps = {
  therapistUserId: string;
  assignedClients: {
    user_id: string;
    client_id: string | null;
    label: string;
    detail_href: string | null;
  }[];
  unassignedClients: ClientOption[];
};

export function TherapistClientAssignmentPanel({
  therapistUserId,
  assignedClients,
  unassignedClients,
}: TherapistClientAssignmentPanelProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const revalidatePaths = [`/admin/therapists/${therapistUserId}`];

  const onAssign = () => {
    if (!selectedClient) return;
    setMessage(null);
    startTransition(async () => {
      const result = await updateClientTherapistAssignment(
        selectedClient,
        therapistUserId,
        revalidatePaths
      );
      if (result.ok) {
        setMessage("Klient zugewiesen.");
        setSelectedClient("");
      } else {
        setMessage(result.error);
      }
    });
  };

  const onRemove = (clientUserId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateClientTherapistAssignment(
        clientUserId,
        null,
        revalidatePaths
      );
      if (result.ok) {
        setMessage("Zuweisung entfernt.");
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-white/60">Klient hinzufügen (ohne Therapeut)</span>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          >
            <option value="">— Klient wählen —</option>
            {unassignedClients.map((c) => (
              <option key={c.user_id} value={c.user_id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || !selectedClient}
          onClick={onAssign}
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {pending ? "Zuweisen …" : "Zuweisen"}
        </button>
      </div>

      {unassignedClients.length === 0 ? (
        <p className="text-xs text-white/40">
          Alle Klient:innen sind bereits einem Therapeuten zugewiesen.
        </p>
      ) : null}

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

      <ul className="space-y-2">
        {assignedClients.length === 0 ? (
          <li className="text-sm text-white/50">Noch keine zugewiesenen Klient:innen.</li>
        ) : (
          assignedClients.map((c) => (
            <li
              key={c.user_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <span className="text-sm text-white/80">
                {c.detail_href ? (
                  <Link href={c.detail_href} className="text-[#63eca9] hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
                {c.client_id ? (
                  <span className="ml-2 font-mono text-xs text-white/40">
                    {c.client_id}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(c.user_id)}
                className="text-xs text-red-300 hover:underline disabled:opacity-50"
              >
                Entfernen
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
