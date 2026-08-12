import { redirect } from "next/navigation";
import { SessionRecordingsGrid } from "@/components/therapy/SessionRecordingsGrid";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { loadTherapySessionsWithNotes } from "@/lib/therapySessions";
import { getStandardSessionCount } from "@/lib/platformTherapyConfig";
import { sortSessionsOnPath } from "@/lib/therapyPathLayout";

export const dynamic = "force-dynamic";

export default async function SitzungsaufnahmenPage() {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") {
    redirect("/");
  }

  const sessions = await loadTherapySessionsWithNotes(supabase, profile.user_id);
  const sessionCount = await getStandardSessionCount(supabase);
  const byNumber = new Map(
    sessions.filter((s) => !s.is_special).map((s) => [s.session_number, s])
  );
  const standardOrdered = Array.from({ length: sessionCount }, (_, i) => {
    const n = i + 1;
    const row = byNumber.get(n);
    return {
      session_number: n,
      topic: row?.topic ?? null,
      is_special: false,
      released_to_client: row?.released_to_client ?? false,
      recording_bunny_video_id: row?.recording_bunny_video_id ?? null,
      recording_title: row?.recording_title ?? null,
    };
  });
  const specialWithRecordings = sortSessionsOnPath(sessions)
    .filter((s) => s.is_special && s.recording_bunny_video_id)
    .map((s) => ({
      session_number: s.session_number,
      topic: s.topic,
      is_special: true,
      released_to_client: s.released_to_client,
      recording_bunny_video_id: s.recording_bunny_video_id,
      recording_title: s.recording_title,
    }));
  const ordered = [...standardOrdered, ...specialWithRecordings];

  const availableCount = ordered.filter(
    (s) => s.released_to_client && s.recording_bunny_video_id
  ).length;

  const bunnyLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim() ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="typo-page-title font-semibold">Sitzungsaufnahmen</h1>
        <p className="mt-2 text-sm text-white/60">
          {availableCount > 0
            ? `${availableCount} Aufnahme${availableCount === 1 ? "" : "n"} verfügbar — nur für freigegebene Sitzungen.`
            : "Sobald Ihr Therapeut Aufnahmen hochlädt und die Sitzung freigibt, erscheinen sie hier."}
        </p>
      </div>

      <SessionRecordingsGrid sessions={ordered} bunnyLibraryId={bunnyLibraryId} />
    </div>
  );
}
