import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const DEFAULT_THERAPY_SESSION_COUNT = 18;

type AdminClient = SupabaseClient<Database>;

export async function getStandardSessionCount(
  supabase: AdminClient
): Promise<number> {
  const { data, error } = await supabase
    .from("platform_therapy_config")
    .select("standard_session_count")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("getStandardSessionCount:", error.message);
    return DEFAULT_THERAPY_SESSION_COUNT;
  }

  const count = data?.standard_session_count;
  if (typeof count === "number" && count >= 1 && count <= 99) return count;
  return DEFAULT_THERAPY_SESSION_COUNT;
}

export async function updateStandardSessionCount(
  supabase: AdminClient,
  count: number,
  actorId: string
): Promise<void> {
  if (!Number.isInteger(count) || count < 1 || count > 99) {
    throw new Error("Anzahl muss zwischen 1 und 99 liegen.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_therapy_config").upsert({
    id: 1,
    standard_session_count: count,
    updated_at: now,
    updated_by: actorId,
  });

  if (error) throw new Error(error.message);
}
