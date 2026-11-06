import { redirect } from "next/navigation";

/** Soft-release: „Neuer Klient“ → Neuer Lead */
export default function SetterNewClientRedirect() {
  redirect("/setter/leads/new");
}
