import { AdminSettingsSubpage } from "@/components/admin/AdminSettingsSubpage";
import { TherapySessionCountForm } from "@/components/admin/TherapySessionCountForm";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { getStandardSessionCount } from "@/lib/platformTherapyConfig";

export const dynamic = "force-dynamic";

export default async function AdminTherapieSettingsPage() {
  const { supabase } = await checkAdminAccess();
  const count = await getStandardSessionCount(supabase);

  const { data: row } = await supabase
    .from("platform_therapy_config")
    .select("updated_at")
    .eq("id", 1)
    .maybeSingle();

  return (
    <AdminSettingsSubpage
      title="Therapie & Sitzungsakte"
      description="Anzahl der Standard-Sitzungen pro Klient auf dem Therapiepfad."
      phaseLabel="Phase SC1 — Sitzungsanzahl"
    >
      <TherapySessionCountForm
        initialCount={count}
        updatedAt={row?.updated_at ?? null}
      />
    </AdminSettingsSubpage>
  );
}
