import { RegistrationPageClient } from "@/components/registrierung/RegistrationPageClient";
import { hasRegistrationGateCookie } from "@/lib/registrationGate";
import { loadActiveRegistrationFields } from "@/lib/registrationFields";

export const dynamic = "force-dynamic";

export default async function RegistrierungPage() {
  const [fields, initialGateOpen] = await Promise.all([
    loadActiveRegistrationFields(),
    hasRegistrationGateCookie(),
  ]);

  return (
    <RegistrationPageClient
      fields={fields}
      initialGateOpen={initialGateOpen}
    />
  );
}
