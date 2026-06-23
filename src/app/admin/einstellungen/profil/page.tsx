import Link from "next/link";
import { SelfProfileSettingsForm } from "@/components/settings/SelfProfileSettingsForm";

export const dynamic = "force-dynamic";

export default function AdminProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/einstellungen" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zu Einstellungen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Mein Profil</h1>
        <p className="mt-1 text-sm text-white/60">
          Anzeigename und Handynummer für Ihr Admin-Profil.
        </p>
      </div>
      <SelfProfileSettingsForm allowedRoles={["admin"]} idPrefix="admin" />
    </div>
  );
}
