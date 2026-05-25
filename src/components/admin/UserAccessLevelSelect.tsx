"use client";

import { useState, useTransition } from "react";
import { updateUserAccessLevel } from "@/app/admin/users/actions";
import type { AccessLevelOption } from "@/lib/accessLevels";

type UserAccessLevelSelectProps = {
  userId: string;
  clientId: string;
  currentLevel: number;
  accessLevels: AccessLevelOption[];
};

export function UserAccessLevelSelect({
  userId,
  clientId,
  currentLevel,
  accessLevels,
}: UserAccessLevelSelectProps) {
  const [level, setLevel] = useState(String(currentLevel));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const next = Number(level);
    if (Number.isNaN(next) || next === currentLevel) return;
    startTransition(async () => {
      setMessage(null);
      const result = await updateUserAccessLevel(userId, next, clientId);
      if (result.ok) {
        setMessage("Stufe gespeichert.");
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-white/50">Zugangsstufe</span>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={pending}
          className="min-w-[180px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
        >
          {accessLevels.map((l) => (
            <option key={l.access_level} value={l.access_level}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending || Number(level) === currentLevel}
        className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.06] disabled:opacity-40"
      >
        {pending ? "Speichern …" : "Stufe speichern"}
      </button>
      {message && (
        <p
          className={`text-sm ${message.includes("fehlgeschlagen") || message.includes("Ungültig") ? "text-red-400" : "text-[#63eca9]"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
