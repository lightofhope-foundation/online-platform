import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";
import { FontSettingsEditor } from "@/components/admin/FontSettingsEditor";
import { checkAdminAccess } from "@/lib/checkAdminAccess";

export const dynamic = "force-dynamic";

export default async function FontSettingsPage() {
  await checkAdminAccess();

  return (
    <AdminSettingsSubpage
      title="Schriftarten"
      description="Schriftarten der gesamten Plattform steuern — große Überschriften, Abschnitte, Fließtext und Menü."
      phaseLabel=""
    >
      <FontSettingsEditor />
    </AdminSettingsSubpage>
  );
}
