"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type AccountCredentialsFormProps = {
  idPrefix?: string;
};

export function AccountCredentialsForm({
  idPrefix = "account",
}: AccountCredentialsFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailPending, startEmailTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) {
        setCurrentEmail(user?.email ?? "");
        setNewEmail(user?.email ?? "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailMessage(null);
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setEmailError("Die neue E-Mail ist identisch mit der aktuellen.");
      return;
    }
    if (!currentPassword) {
      setEmailError("Bitte aktuelles Passwort zur Bestätigung eingeben.");
      return;
    }

    startEmailTransition(async () => {
      try {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });
        if (reauthError) {
          setEmailError("Aktuelles Passwort ist falsch.");
          return;
        }

        const { error } = await supabase.auth.updateUser({ email: trimmed });
        if (error) {
          setEmailError(error.message);
          return;
        }

        setEmailMessage(
          "Bestätigungsmail wurde gesendet. Bitte beide Postfächer prüfen, bis die Änderung aktiv ist."
        );
        setCurrentPassword("");
      } catch (err) {
        setEmailError(err instanceof Error ? err.message : "E-Mail konnte nicht geändert werden");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordError("Bitte aktuelles Passwort eingeben.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Neues Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwort-Bestätigung stimmt nicht überein.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });
        if (reauthError) {
          setPasswordError("Aktuelles Passwort ist falsch.");
          return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message);
          return;
        }

        setPasswordMessage("Passwort wurde aktualisiert.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setPasswordError(
          err instanceof Error ? err.message : "Passwort konnte nicht geändert werden"
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-white/60">Konto wird geladen…</div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <h3 className="text-sm font-medium text-white/80">E-Mail-Adresse</h3>
        <p className="text-xs text-white/45">
          Aktuell: <span className="text-white/70">{currentEmail || "—"}</span>
        </p>
        <div>
          <label
            htmlFor={`${idPrefix}-new-email`}
            className="mb-1.5 block text-xs text-white/50"
          >
            Neue E-Mail
          </label>
          <input
            id={`${idPrefix}-new-email`}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-email-password`}
            className="mb-1.5 block text-xs text-white/50"
          >
            Aktuelles Passwort (Bestätigung)
          </label>
          <input
            id={`${idPrefix}-email-password`}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
        {emailError ? <p className="text-sm text-red-300">{emailError}</p> : null}
        {emailMessage ? <p className="text-sm text-[#63eca9]">{emailMessage}</p> : null}
        <button
          type="submit"
          disabled={emailPending}
          className="rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-5 py-2 text-sm font-medium text-[#63eca9] transition-colors hover:bg-[#63eca9]/20 disabled:opacity-50"
        >
          {emailPending ? "Wird gesendet…" : "E-Mail ändern"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t border-white/10 pt-8">
        <h3 className="text-sm font-medium text-white/80">Passwort</h3>
        <div>
          <label
            htmlFor={`${idPrefix}-current-password`}
            className="mb-1.5 block text-xs text-white/50"
          >
            Aktuelles Passwort
          </label>
          <input
            id={`${idPrefix}-current-password`}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-new-password`}
            className="mb-1.5 block text-xs text-white/50"
          >
            Neues Passwort
          </label>
          <input
            id={`${idPrefix}-new-password`}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-confirm-password`}
            className="mb-1.5 block text-xs text-white/50"
          >
            Neues Passwort bestätigen
          </label>
          <input
            id={`${idPrefix}-confirm-password`}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
        {passwordError ? <p className="text-sm text-red-300">{passwordError}</p> : null}
        {passwordMessage ? (
          <p className="text-sm text-[#63eca9]">{passwordMessage}</p>
        ) : null}
        <button
          type="submit"
          disabled={passwordPending}
          className="rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-5 py-2 text-sm font-medium text-[#63eca9] transition-colors hover:bg-[#63eca9]/20 disabled:opacity-50"
        >
          {passwordPending ? "Wird gespeichert…" : "Passwort ändern"}
        </button>
      </form>
    </div>
  );
}
