import { TherapistOrbitCanvas } from "@/components/orbit/TherapistOrbitCanvas";
import { checkTherapistAccess } from "@/lib/authRoles";
import { loadTherapistOrbitData } from "@/lib/therapistOrbitData";

export const dynamic = "force-dynamic";

export default async function TherapistOrbitPage() {
  const { user, supabase } = await checkTherapistAccess();

  const data = await loadTherapistOrbitData(supabase, user.id, {
    clientDetailHref: (client) =>
      client.client_id
        ? `/therapist/clients/${client.client_id.toLowerCase()}`
        : null,
  });

  if (!data) {
    return (
      <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        Orbit konnte nicht geladen werden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Orbit</h1>
        <p className="text-sm text-white/60">
          Ihre Klient:innen um Sie herum — Distanz zeigt den restlichen
          Sitzungsfortschritt. Bubbles vertikal verschieben.
        </p>
      </div>

      <TherapistOrbitCanvas data={data} />
    </div>
  );
}
