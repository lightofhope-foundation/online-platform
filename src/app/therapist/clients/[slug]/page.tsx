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
        ← Meine Klienten
      </Link>

      {!detail.isAssignedTherapist ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
          Plattformweite Einsicht — dieser Klient ist dir nicht zugewiesen (nur Lesen).
        </p>
      ) : null}

      <LeadDetailCards
        name={detail.name}
        clientId={detail.clientId}
        accessRevoked={detail.accessRevoked}
        intake={intake}
        eyebrow="Klient"
        statusHint={detail.archived ? "archiviert" : null}
        editable={detail.isAssignedTherapist}
      />

      {detail.isAssignedTherapist ? (
        <>
          <div
            className="mx-1 border-t border-white/10"
            role="separator"
            aria-hidden
          />
          <TherapistClientTiles clientId={detail.clientId} />
        </>
      ) : null}
    </div>
  );
}
