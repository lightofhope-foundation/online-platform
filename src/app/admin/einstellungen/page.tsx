import { AdminSettingsTiles } from "@/components/admin/AdminSettingsTiles";

export const dynamic = "force-dynamic";

export default function AdminEinstellungenPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Plattform-Richtlinien für Videos, Registrierung und Klienten-Stufen.
        </p>
      </div>
      <AdminSettingsTiles />
    </div>
  );
}
