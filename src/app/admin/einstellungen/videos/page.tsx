import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";

export const dynamic = "force-dynamic";

export default function AdminEinstellungenVideosPage() {
  return (
    <AdminSettingsSubpage
      title="Videokurseinstellungen"
      description="Globale Freischalt-Regeln, Stufe 0–5 und Suche nach Einzelklienten."
      phaseLabel="Phase 3.3 — Videokurseinstellungen"
    />
  );
}
