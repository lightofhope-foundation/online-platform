"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { updateProfileSelfSettings } from "@/app/actions/profileSelfSettings";
import { formatDisplayName } from "@/lib/formatDisplayName";
import { ProfileSelfSettingsFields } from "./ProfileSelfSettingsFields";

type SelfProfileSettingsFormProps = {
  allowedRoles: Array<"admin" | "therapist" | "client">;
  idPrefix: string;
};

export function SelfProfileSettingsForm({
  allowedRoles,
  idPrefix,
}: SelfProfileSettingsFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Nicht angemeldet.");
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select(
            "client_id, role, first_name, last_name, display_alias, phone_number"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("Profil nicht gefunden.");
          return;
        }
        if (!allowedRoles.includes(data.role as "admin" | "therapist" | "client")) {
          setError("Keine Berechtigung für diese Seite.");
          return;
        }

        if (!cancelled) {
          setClientId(data.client_id);
          setDisplayName(data.display_alias ?? "");
          setPhoneNumber(data.phone_number ?? "");
          setSuggestion(
            formatDisplayName(data.first_name, data.last_name, user.email)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Fehler beim Laden");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowedRoles, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateProfileSelfSettings({
          displayName,
          phoneNumber,
        });
        setMessage("Gespeichert");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Speichern");
      }
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-white/60">Profil wird geladen…</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      {clientId ? (
        <div>
          <label className="mb-1.5 block text-xs text-white/50">Nutzer-ID</label>
          <input
            type="text"
            value={clientId}
            readOnly
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white/50"
          />
        </div>
      ) : null}

      <ProfileSelfSettingsFields
        displayNameId={`${idPrefix}-display-name`}
        phoneId={`${idPrefix}-phone`}
        displayName={displayName}
        phoneNumber={phoneNumber}
        onDisplayNameChange={setDisplayName}
        onPhoneNumberChange={setPhoneNumber}
        displayNameSuggestion={suggestion}
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-[#63eca9]">{message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-6 py-2.5 text-sm font-medium text-[#63eca9] transition-colors hover:bg-[#63eca9]/20 disabled:opacity-50"
      >
        {isPending ? "Wird gespeichert…" : "Speichern"}
      </button>
    </form>
  );
}
