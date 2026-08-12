import Link from "next/link";
import { SelfProfileSettingsForm } from "@/components/settings/SelfProfileSettingsForm";
import { AccountCredentialsForm } from "@/components/settings/AccountCredentialsForm";

export const dynamic = "force-dynamic";

export default function AdminProfileSettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/einstellungen" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zu Einstellungen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Mein Profil</h1>
        <p className="mt-1 text-sm text-white/60">
          Anzeigename, Handynummer, E-Mail und Passwort für Ihr Admin-Konto.
        </p>
      </div>

      <section className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">Anzeige</h2>
        <SelfProfileSettingsForm allowedRoles={["admin"]} idPrefix="admin" />
      </section>

      <section className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">Anmeldung</h2>
        <div className="mx-auto max-w-lg">
          <AccountCredentialsForm idPrefix="admin-auth" />
        </div>
      </section>
    </div>
  );
}
