import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapistOrbitCanvas } from "@/components/orbit/TherapistOrbitCanvas";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { loadTherapistOrbitData } from "@/lib/therapistOrbitData";

export const dynamic = "force-dynamic";

export default async function AdminTherapistOrbitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await checkAdminAccess();

  const data = await loadTherapistOrbitData(supabase, id, {
    clientDetailHref: (client) =>
      client.client_id
        ? `/admin/users/${client.client_id.toLowerCase()}`
        : null,
  });

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/therapists/${id}`}
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zur Therapeutenakte
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Orbit — {data.therapist.label}</h1>
        <p className="text-sm text-white/60">
          Klient:innen links/rechts; Linienlänge = restlicher Sitzungsfortschritt.
          Bubbles vertikal verschieben.
        </p>
      </div>

      <TherapistViewTabs active="orbit" />

      <TherapistOrbitCanvas data={data} />
    </div>
  );
}
