"use client";

import { useState, useTransition } from "react";
import {
  getRegistrationInviteCode,
  regenerateRegistrationInviteCode,
} from "@/app/admin/einstellungen/invite-actions";

type RegistrationInvitePanelProps = {
  initialCode: string;
  initialUpdatedAt: string | null;
};

export function RegistrationInvitePanel({
  initialCode,
  initialUpdatedAt,
}: RegistrationInvitePanelProps) {
  const [code, setCode] = useState(initialCode);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Kopieren fehlgeschlagen");
    }
  };

  const refresh = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await getRegistrationInviteCode();
      if (result.ok) {
        setCode(result.code);
        setUpdatedAt(result.updatedAt);
      } else {
        setMessage(result.error);
      }
    });
  };

  const regenerate = () => {
    if (
      !confirm(
        "Neuen Code erzeugen? Der aktuelle Code funktioniert danach nicht mehr."
      )
    ) {
      return;
    }
    startTransition(async () => {
      setMessage(null);
      const result = await regenerateRegistrationInviteCode();
      if (result.ok) {
        setCode(result.code);
        setUpdatedAt(new Date().toISOString());
        setMessage("Neuer Registrierungscode wurde erzeugt.");
      } else {
        setMessage(result.error);
      }
    });
  };

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString("de-DE", {
        timeZone: "Europe/Berlin",
      })
    : null;

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-medium text-white">Registrierungscode</h2>
      <p className="mt-1 text-sm text-white/55">
        Einmaliger Zugang zu{" "}
        <span className="font-mono text-white/70">/registrierung</span>. Nach
        erfolgreicher Anmeldung wird der Code automatisch erneuert.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code className="rounded-lg border border-[#63eca9]/30 bg-black/30 px-4 py-2.5 font-mono text-lg tracking-wider text-[#63eca9]">
          {code}
        </code>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-[#63eca9]/40 hover:text-[#63eca9]"
        >
          {copied ? "Kopiert" : "Kopieren"}
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={pending}
          className="rounded-full bg-[#63eca9] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#53e0b6] disabled:opacity-50"
        >
          Neuen Code erzeugen
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="text-sm text-white/50 hover:text-white/80"
        >
          Aktualisieren
        </button>
      </div>

      {updatedLabel && (
        <p className="mt-2 text-xs text-white/40">Zuletzt geändert: {updatedLabel}</p>
      )}
      {message && <p className="mt-2 text-sm text-[#63eca9]">{message}</p>}
    </div>
  );
}
