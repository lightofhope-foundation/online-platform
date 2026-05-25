import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";

export const dynamic = "force-dynamic";

export default function AdminEinstellungenLevelsPage() {
  return (
    <AdminSettingsSubpage
      title="Klienten-Stufen"
      description="Zugangsstufen 0–5 und ihre Bedeutung auf der Plattform."
      phaseLabel="Phase 3.7 — Klienten-Stufen"
    />
  );
}
