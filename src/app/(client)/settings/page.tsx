import { ClientSettingsForm } from "@/components/settings/ClientSettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Persönliche Daten für Ihr Profil. Ihre Nutzer-ID ist schreibgeschützt.
        </p>
      </div>
      <ClientSettingsForm />
    </div>
  );
}
