"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { updateClientProfile } from "@/app/(client)/settings/actions";

type ProfileState = {
  clientId: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  houseNumber: string;
};

export function ClientSettingsForm() {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<ProfileState>({
    clientId: null,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    street: "",
    houseNumber: "",
  });

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
            "client_id, role, first_name, last_name, date_of_birth, street, house_number"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("Profil nicht gefunden.");
          return;
        }
        if (data.role !== "client") {
          setError("Diese Seite ist nur für Klienten verfügbar.");
          return;
        }

        if (!cancelled) {
          setProfile({
            clientId: data.client_id,
            firstName: data.first_name ?? "",
            lastName: data.last_name ?? "",
            dateOfBirth: data.date_of_birth ?? "",
            street: data.street ?? "",
            houseNumber: data.house_number ?? "",
          });
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
  }, [supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateClientProfile({
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.dateOfBirth || null,
          street: profile.street || null,
          houseNumber: profile.houseNumber || null,
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

  if (error && !profile.clientId) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div>
        <label className="mb-1.5 block text-xs text-white/50">Nutzer-ID</label>
        <input
          type="text"
          value={profile.clientId ?? "—"}
          readOnly
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white/50"
        />
        <p className="mt-1 text-xs text-white/40">Wird von der Plattform vergeben und kann nicht geändert werden.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-xs text-white/50">
            Vorname
          </label>
          <input
            id="firstName"
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-xs text-white/50">
            Nachname
          </label>
          <input
            id="lastName"
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="mb-1.5 block text-xs text-white/50">
          Geburtsdatum
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={profile.dateOfBirth}
          onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50 [color-scheme:dark]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor="street" className="mb-1.5 block text-xs text-white/50">
            Straße
          </label>
          <input
            id="street"
            type="text"
            value={profile.street}
            onChange={(e) => setProfile((p) => ({ ...p, street: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
            autoComplete="street-address"
          />
        </div>
        <div>
          <label htmlFor="houseNumber" className="mb-1.5 block text-xs text-white/50">
            Hausnr.
          </label>
          <input
            id="houseNumber"
            type="text"
            value={profile.houseNumber}
            onChange={(e) => setProfile((p) => ({ ...p, houseNumber: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
          />
        </div>
      </div>

      {error && profile.clientId && (
        <p className="text-sm text-red-300">{error}</p>
      )}
      {message && <p className="text-sm text-[#63eca9]">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-6 py-2.5 text-sm font-medium text-[#63eca9] transition-colors hover:bg-[#63eca9]/20 disabled:opacity-50"
      >
        {isPending ? "Wird gespeichert…" : "Speichern"}
      </button>

      <p className="text-xs text-white/40">
        E-Mail und Passwort können hier später geändert werden.
      </p>
    </form>
  );
}
