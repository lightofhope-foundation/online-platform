import { StaffProfileSettingsForm } from "@/components/settings/StaffProfileSettingsForm";

export const dynamic = "force-dynamic";

export default function SetterSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-page-title font-semibold">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Profil, Zoom-Link und Calendly für Setter & Closer.
        </p>
      </div>
      <StaffProfileSettingsForm portalRole="setter_closer" idPrefix="setter" />
    </div>
  );
}
