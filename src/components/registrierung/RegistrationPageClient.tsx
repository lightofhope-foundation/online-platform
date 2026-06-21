"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { RegistrationFieldDefinition } from "@/lib/registrationFields";
import {
  registerClient,
  redirectAfterRegistration,
  verifyRegistrationInviteCode,
} from "@/app/registrierung/actions";

type RegistrationPageClientProps = {
  fields: RegistrationFieldDefinition[];
  initialGateOpen: boolean;
};

function inputTypeForField(fieldKey: string): string {
  if (fieldKey === "date_of_birth") return "date";
  if (fieldKey.includes("email")) return "email";
  return "text";
}

export function RegistrationPageClient({
  fields,
  initialGateOpen,
}: RegistrationPageClientProps) {
  const [gateOpen, setGateOpen] = useState(initialGateOpen);
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const onVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyRegistrationInviteCode(inviteCode);
      if (result.ok) {
        setGateOpen(true);
      } else {
        setError(result.error);
      }
    });
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    startTransition(async () => {
      const result = await registerClient({ email, password, values });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.clientId
          ? `Registrierung erfolgreich. Ihre Nutzer-ID: ${result.clientId}`
          : "Registrierung erfolgreich."
      );
      setTimeout(() => {
        redirectAfterRegistration(result.clientId);
      }, 1500);
    });
  };

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center text-white px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-1">Registrierung</h1>
        <p className="text-sm text-white/55 mb-6">
          Zugang nur mit gültigem Kurs-Registrierungscode.
        </p>

        {!gateOpen ? (
          <form onSubmit={onVerifyCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/80">
                Zugangscode
              </label>
              <input
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 font-mono tracking-wider outline-none focus:border-[#63eca9]/50 uppercase"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="XXXX-XXXX"
                autoComplete="off"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#63eca9] px-3 py-2 font-medium text-black hover:bg-[#53e0b6] disabled:opacity-50"
            >
              {pending ? "Prüfen…" : "Weiter zur Registrierung"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-sm text-white/80">
                  {field.label}
                  {field.required && (
                    <span className="text-[#63eca9] ml-0.5">*</span>
                  )}
                </label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-[#63eca9]/50"
                  type={inputTypeForField(field.field_key)}
                  value={values[field.field_key] ?? ""}
                  onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}

            <div className="border-t border-white/10 pt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/80">E-Mail</label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-[#63eca9]/50"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80">Passwort</label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-[#63eca9]/50"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80">
                  Passwort bestätigen
                </label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-[#63eca9]/50"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-[#63eca9]">{success}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#63eca9] px-3 py-2 font-medium text-black hover:bg-[#53e0b6] disabled:opacity-50"
            >
              {pending ? "Wird registriert…" : "Konto erstellen"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          Bereits registriert?{" "}
          <Link href="/login" className="text-[#63eca9] hover:underline">
            Zum Login
          </Link>
        </p>
      </div>
    </main>
  );
}
