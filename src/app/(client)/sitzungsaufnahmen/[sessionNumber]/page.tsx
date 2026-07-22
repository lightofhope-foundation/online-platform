import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BunnyEmbedPlayer } from "@/components/video/BunnyEmbedPlayer";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  formatTherapySessionLabel,
  loadTherapySessionsWithNotes,
} from "@/lib/therapySessions";

export const dynamic = "force-dynamic";

export default async function SitzungsaufnahmeWatchPage({
  params,
}: {
  params: Promise<{ sessionNumber: string }>;
}) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const { sessionNumber: raw } = await params;
  const sessionNumber = Number(raw);
  if (!Number.isInteger(sessionNumber) || sessionNumber < 1) {
    notFound();
  }

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") notFound();

  const sessions = await loadTherapySessionsWithNotes(supabase, profile.user_id);
  const session = sessions.find((s) => s.session_number === sessionNumber);
  if (!session?.released_to_client || !session.recording_bunny_video_id) {
    notFound();
  }

  const bunnyLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  if (!bunnyLibraryId) notFound();

  const sessionLabel = formatTherapySessionLabel(
    sessionNumber,
    session.topic,
    session.is_special
  );
  const recordingTitle = session.recording_title?.trim();
  const showRecordingTitle =
    recordingTitle && recordingTitle.toLowerCase() !== sessionLabel.toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sitzungsaufnahmen" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zu Sitzungsaufnahmen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{sessionLabel}</h1>
        {showRecordingTitle && (
          <p className="mt-1 text-sm text-white/50">{recordingTitle}</p>
        )}
        <Link
          href={`/sitzungen?sitzung=${sessionNumber}`}
          className="mt-2 inline-block text-sm text-[#63eca9] hover:underline"
        >
          Zur Sitzungsakte
        </Link>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-2xl">
        <BunnyEmbedPlayer
          libraryId={bunnyLibraryId}
          bunnyVideoId={session.recording_bunny_video_id}
          title={sessionLabel}
          className="min-h-[360px] rounded-none sm:min-h-[480px]"
        />
      </div>
    </div>
  );
}
