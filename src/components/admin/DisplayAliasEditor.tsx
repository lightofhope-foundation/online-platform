"use client";

import { useState, useTransition } from "react";
import { updateDisplayAlias } from "@/app/admin/therapists/actions";
import { formatDisplayName } from "@/lib/formatDisplayName";

type DisplayAliasEditorProps = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  currentAlias: string | null;
  revalidatePaths?: string[];
};

export function DisplayAliasEditor({
  userId,
  firstName,
  lastName,
  email,
  currentAlias,
  revalidatePaths = [],
}: DisplayAliasEditorProps) {
  const [alias, setAlias] = useState(currentAlias ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggestion = formatDisplayName(firstName, lastName, email);

  const onSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDisplayAlias(userId, alias, revalidatePaths);
      if (result.ok) {
        setMessage("Anzeigename gespeichert.");
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`alias-${userId}`} className="mb-1 block text-xs text-white/50">
          Anzeigename (Admin)
        </label>
        <input
          id={`alias-${userId}`}
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder={suggestion}
          maxLength={64}
          className="w-full max-w-sm rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#63eca9]/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/45">
          Kurzname in Listen, Bäumen und Benachrichtigungen. Vorschlag:{" "}
          <button
            type="button"
            className="text-[#63eca9] hover:underline"
            onClick={() => setAlias(suggestion)}
          >
            {suggestion}
          </button>
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="rounded-md border border-[#63eca9]/40 bg-[#63eca9]/10 px-4 py-2 text-sm text-[#63eca9] transition hover:bg-[#63eca9]/20 disabled:opacity-50"
      >
        {pending ? "Speichern …" : "Anzeigename speichern"}
      </button>
      {message ? <p className="text-sm text-white/70">{message}</p> : null}
    </div>
  );
}
