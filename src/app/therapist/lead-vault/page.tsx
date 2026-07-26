import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Therapeut sieht keinen Schachtel-Vault — Redirect zur Klientenliste (LV1.5 folgt). */
export default function TherapistLeadVaultRemovedPage() {
  redirect("/therapist/clients");
}
