import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";
import { RegistrationFieldsEditor } from "@/components/admin/RegistrationFieldsEditor";
import { loadActiveRegistrationFields } from "@/lib/registrationFields";

export const dynamic = "force-dynamic";

export default async function AdminEinstellungenRegistrierungPage() {
  const fields = await loadActiveRegistrationFields();

  return (
    <AdminSettingsSubpage
      title="Nutzereinstellungen"
      description="Pflichtfelder und zusätzliche Angaben für die Registrierung unter /registrierung."
      phaseLabel=""
    >
      <RegistrationFieldsEditor initialFields={fields} />
    </AdminSettingsSubpage>
  );
}
