import { notFound, redirect } from "next/navigation";
import { TherapySessionsWorkspace } from "@/components/therapy/TherapySessionsWorkspace";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { loadTherapySessionsWithNotes } from "@/lib/therapySessions";

export const dynamic = "force-dynamic";

export default async function SitzungenPage() {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role, client_id, first_name, last_name, display_alias")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") {
    notFound();
  }

  const sessions = await loadTherapySessionsWithNotes(supabase, profile.user_id, {
    clientView: true,
  });

  const { data: assignment } = await supabase
    .from("clients")
    .select("therapist_user_id")
    .eq("user_id", profile.user_id)
    .is("deleted_at", null)
    .maybeSingle();

  let therapistName = "Ihr Therapeut";
  let therapistPhone: string | null = null;

  if (assignment?.therapist_user_id) {
    const { data: therapistProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, display_alias, phone_number")
      .eq("user_id", assignment.therapist_user_id)
      .maybeSingle();

    if (therapistProfile) {
      therapistName = resolvePersonLabel(
        therapistProfile.first_name,
        therapistProfile.last_name,
        null,
        therapistProfile.display_alias
      );
      therapistPhone = therapistProfile.phone_number;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Sitzungen</h1>
        <p className="mt-2 text-sm text-white/60">
          Therapeut: <span className="text-white/90">{therapistName}</span>
          {therapistPhone && (
            <>
              {" "}
              · Tel.{" "}
              <a href={`tel:${therapistPhone}`} className="text-[#63eca9] hover:underline">
                {therapistPhone}
              </a>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Nur freigegebene Sitzungen sind anklickbar. Ihre Notizen sehen Sie in den
          Klienten-Einträgen.
        </p>
      </div>

      <TherapySessionsWorkspace
        sessions={sessions}
        mode="client"
        therapistName={therapistName}
      />
    </div>
  );
}
