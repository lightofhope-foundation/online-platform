"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setterCreateClient } from "@/app/setter/actions";

export function SetterCreateClientForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Hallo123!");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.clientId) {
        router.push(`/setter/users/${result.clientId.toLowerCase()}`);
      } else {
        router.push("/setter/leads");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
        Es wird ein <strong className="text-white/80">Lead</strong> angelegt (noch kein
        Klient). Therapeut-Zuweisung erst nach Umwandlung durch den Erstgesprächler.
        Passwort-Vergabe entfällt später beim Live-Onboarding per Bestätigungsmail.
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
        <label className="mb-1.5 block text-xs text-white/50">
          Start-Passwort (vorläufig)
        </label>
        <input
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
        />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#63eca9] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-50"
      >
        {pending ? "Wird angelegt…" : "Lead anlegen"}
      </button>
    </form>
  );
}
