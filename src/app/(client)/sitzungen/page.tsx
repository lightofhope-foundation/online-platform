import { notFound, redirect } from "next/navigation";
import { TherapySessionsWorkspace } from "@/components/therapy/TherapySessionsWorkspace";
import { SessionPathHero } from "@/components/therapy/SessionPathHero";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { LOH_SESSION_PATH_DEFAULT_BG } from "@/lib/branding";
import { loadTherapySessionsWithNotes } from "@/lib/therapySessions";

export const dynamic = "force-dynamic";

export default async function SitzungenPage({
  searchParams,
}: {
  searchParams: Promise<{ sitzung?: string }>;
}) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const { sitzung: sitzungRaw } = await searchParams;
  const sitzungNum = sitzungRaw ? Number(sitzungRaw) : NaN;
  const initialSessionNumber =
    Number.isInteger(sitzungNum) && sitzungNum >= 1 && sitzungNum <= 18
      ? sitzungNum
      : null;

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
    .select("therapist_user_id, session_path_background_url")
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

  const bunnyLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim() ?? "";
  const backgroundUrl =
    assignment?.session_path_background_url?.trim() || LOH_SESSION_PATH_DEFAULT_BG;

  return (
    <SessionPathHero
      title="DEINE SITZUNGSÜBERSICHT"
      backgroundUrl={backgroundUrl}
      subtitle={
        <>
          Therapeut: <span className="text-white/85">{therapistName}</span>
          {therapistPhone ? (
            <>
              {" "}
              · Tel.{" "}
              <a href={`tel:${therapistPhone}`} className="text-[#63eca9] hover:underline">
                {therapistPhone}
              </a>
            </>
          ) : null}
          <br />
          Nur freigegebene Sitzungen sind anklickbar.
        </>
      }
    >
      <TherapySessionsWorkspace
        sessions={sessions}
        mode="client"
        therapistName={therapistName}
        initialSessionNumber={initialSessionNumber}
        bunnyLibraryId={bunnyLibraryId}
      />
    </SessionPathHero>
  );
}
