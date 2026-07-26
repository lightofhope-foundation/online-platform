import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadDetailCards } from "@/components/lead-vault/LeadDetailCards";
import { TherapistClientTiles } from "@/components/therapist/TherapistClientTiles";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import { loadTherapistClientDetail } from "@/lib/therapistClients";

export const dynamic = "force-dynamic";

export default async function TherapistClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  const { user, supabase } = await checkTherapistAccess();
  const detail = await loadTherapistClientDetail(supabase, user.id, clientId);
  if (!detail) notFound();

  const intake = {
    ...detail.intake,
    email: detail.intake.email || detail.email || undefined,
  };

  return (
    <div className="space-y-8">
      <Link href="/therapist/clients" className="text-sm text-[#63eca9] hover:underline">
        ← Klientenakte
      </Link>

      <LeadDetailCards
        name={detail.name}
        clientId={detail.clientId}
        accessRevoked={detail.accessRevoked}
        intake={intake}
        eyebrow="Klient"
        statusHint={detail.archived ? "archiviert" : null}
        editable
      />

      <div
        className="mx-1 border-t border-white/10"
        role="separator"
        aria-hidden
      />

      <TherapistClientTiles clientId={detail.clientId} />
    </div>
  );
}
