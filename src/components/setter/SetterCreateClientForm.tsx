"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setterCreateClient } from "@/app/setter/actions";
import type { TherapistOption } from "@/lib/adminTherapistData";

type SetterCreateClientFormProps = {
  therapists: TherapistOption[];
};

export function SetterCreateClientForm({ therapists }: SetterCreateClientFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Hallo123!");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [therapistUserId, setTherapistUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setterCreateClient({
        email,
        password,
        firstName,
        lastName,
        // Standard: ohne Therapeut → erscheint in Setter-Pipeline
        therapistUserId: therapistUserId || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.clientId) {
        router.push(`/setter/users/${result.clientId.toLowerCase()}`);
      } else {
        router.push("/setter/users");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
        Neue Klienten starten <strong className="text-white/80">ohne Therapeut</strong> und
        erscheinen in „Offene Leads“. Therapeut optional schon jetzt oder später zuweisen.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-white/50">Vorname</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/50">Nachname</label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-white/50">E-Mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-white/50">Start-Passwort</label>
        <input
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-white/50">
          Therapeut (optional — sonst offener Lead)
        </label>
        <select
          value={therapistUserId}
          onChange={(e) => setTherapistUserId(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
        >
          <option value="">— Noch nicht zuordnen —</option>
          {therapists.map((t) => (
            <option key={t.user_id} value={t.user_id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#63eca9] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-50"
      >
        {pending ? "Wird angelegt…" : "Klient anlegen"}
      </button>
    </form>
  );
}
