import { StaffProfileSettingsForm } from "@/components/settings/StaffProfileSettingsForm";

export const dynamic = "force-dynamic";

export default function TherapistSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-page-title font-semibold">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Anzeigename, Handynummer, Zoom- und Calendly-Link.
        </p>
      </div>
      <StaffProfileSettingsForm portalRole="therapist" idPrefix="therapist" />
    </div>
  );
}
