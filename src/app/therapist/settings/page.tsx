import { SelfProfileSettingsForm } from "@/components/settings/SelfProfileSettingsForm";

export const dynamic = "force-dynamic";

export default function TherapistSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Anzeigename und Handynummer für Ihr Therapeuten-Profil.
        </p>
      </div>
      <SelfProfileSettingsForm allowedRoles={["therapist"]} idPrefix="therapist" />
    </div>
  );
}
