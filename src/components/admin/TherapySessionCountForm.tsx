"use client";

import { useState, useTransition } from "react";
import { saveTherapySessionCount } from "@/app/admin/einstellungen/therapie/actions";

type TherapySessionCountFormProps = {
  initialCount: number;
  updatedAt: string | null;
};

export function TherapySessionCountForm({
  initialCount,
  updatedAt,
}: TherapySessionCountFormProps) {
  const [count, setCount] = useState(String(initialCount));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const parsed = Number.parseInt(count, 10);
    startTransition(async () => {
      const result = await saveTherapySessionCount(parsed);
      if (result.ok) {
        setMessage("Gespeichert. Neue Klienten erhalten diese Anzahl Sitzungen.");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label htmlFor="therapy-session-count" className="mb-1.5 block text-xs text-white/50">
          Standard-Sitzungen pro Klient
        </label>
        <input
          id="therapy-session-count"
          type="number"
          min={1}
          max={99}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
        />
        <p className="mt-2 text-xs text-white/45">
          Gilt für neu angelegte und noch nicht vollständig geseedete Klienten-Akten.
          Notsitzungen bleiben zusätzlich einfügbar.
        </p>
        {updatedAt ? (
          <p className="mt-1 text-xs text-white/35">
            Zuletzt geändert: {new Date(updatedAt).toLocaleString("de-DE")}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-[#63eca9]">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-6 py-2.5 text-sm font-medium text-[#63eca9] transition-colors hover:bg-[#63eca9]/20 disabled:opacity-50"
      >
        {pending ? "Wird gespeichert…" : "Speichern"}
      </button>
    </form>
  );
}
