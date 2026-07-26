import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ boardId: string }> };

/** Therapeut sieht keinen Schachtel-Vault — Redirect zur Klientenliste (LV1.5 folgt). */
export default async function TherapistLeadVaultBoardRemovedPage({ params }: Props) {
  await params;
  redirect("/therapist/clients");
}
