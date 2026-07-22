"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { updateStaffProfileSettings } from "@/app/actions/profileSelfSettings";
import { formatDisplayName } from "@/lib/formatDisplayName";
import { ProfileSelfSettingsFields } from "./ProfileSelfSettingsFields";

type StaffPortalRole = "therapist" | "setter_closer" | "admin";

type StaffProfileSettingsFormProps = {
  portalRole: StaffPortalRole;
  idPrefix: string;
};

export function StaffProfileSettingsForm({
  portalRole,
  idPrefix,
}: StaffProfileSettingsFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zoomMeetingUrl, setZoomMeetingUrl] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
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
            "role, first_name, last_name, display_alias, phone_number, zoom_meeting_url, calendly_url"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("Profil nicht gefunden.");
          return;
        }

        if (!cancelled) {
          setDisplayName(data.display_alias ?? "");
          setPhoneNumber(data.phone_number ?? "");
          setZoomMeetingUrl(data.zoom_meeting_url ?? "");
          setCalendlyUrl(data.calendly_url ?? "");
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
  }, [supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateStaffProfileSettings({
          displayName,
          phoneNumber,
          zoomMeetingUrl,
          calendlyUrl,
          portalRole,
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

  if (error && !displayName && !phoneNumber) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <ProfileSelfSettingsFields
        displayNameId={`${idPrefix}-display-name`}
        phoneId={`${idPrefix}-phone`}
        displayName={displayName}
        phoneNumber={phoneNumber}
        onDisplayNameChange={setDisplayName}
        onPhoneNumberChange={setPhoneNumber}
        displayNameSuggestion={suggestion}
        zoomMeetingUrl={zoomMeetingUrl}
        calendlyUrl={calendlyUrl}
        onZoomMeetingUrlChange={setZoomMeetingUrl}
        onCalendlyUrlChange={setCalendlyUrl}
        showBookingLinks
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
