import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";

export const dynamic = "force-dynamic";

export default function AdminEinstellungenRegistrierungPage() {
  return (
    <AdminSettingsSubpage
      title="Nutzereinstellungen"
      description="Pflichtfelder und zusätzliche Angaben für die Registrierung."
      phaseLabel="Phase 3.6 — Nutzereinstellungen"
    />
  );
}
