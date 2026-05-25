import Link from "next/link";
import { UnlockDefaultsEditor, type UnlockDefaultsState } from "@/components/admin/UnlockDefaultsEditor";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const DEFAULTS_FALLBACK: UnlockDefaultsState = {
  first_gated_video_position: 4,
  first_unlock_offset_days: 7,
  subsequent_unlock_interval_days: 3,
  configured: true,
};

export default async function AdminEinstellungenVideosPage() {
  const supabase = getSupabaseAdminClient();
  const accessLevels = await fetchAccessLevelOptions();

  const { data: globalRow } = await supabase
    .from("platform_unlock_defaults")
    .select(
      "first_gated_video_position, first_unlock_offset_days, subsequent_unlock_interval_days"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const globalDefaults: UnlockDefaultsState = globalRow
    ? { ...globalRow, configured: true }
    : DEFAULTS_FALLBACK;

  const { data: levelRows } = await supabase
    .from("platform_unlock_defaults_by_level")
    .select(
      "access_level, first_gated_video_position, first_unlock_offset_days, subsequent_unlock_interval_days"
    );

  const levelDefaults: Record<number, UnlockDefaultsState | null> = {};
  accessLevels.forEach((l) => {
    const row = levelRows?.find((r) => r.access_level === l.access_level);
    levelDefaults[l.access_level] = row
      ? {
          first_gated_video_position: row.first_gated_video_position,
          first_unlock_offset_days: row.first_unlock_offset_days,
          subsequent_unlock_interval_days: row.subsequent_unlock_interval_days,
          configured: true,
        }
      : null;
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/einstellungen"
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zu Einstellungen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Videokurseinstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Standard-Freischaltung für alle Klienten, pro Zugangsstufe und (ab Phase 3.5) pro
          Einzelperson.
        </p>
      </div>

      <UnlockDefaultsEditor
        globalDefaults={globalDefaults}
        levelDefaults={levelDefaults}
        accessLevels={accessLevels}
      />
    </div>
  );
}
