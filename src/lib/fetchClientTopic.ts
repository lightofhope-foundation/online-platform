import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DEFAULT_LOH_TOPIC } from "@/lib/lohVideoCatalog";

export async function fetchClientPrimaryTopic(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined
): Promise<string> {
  if (!userId) return DEFAULT_LOH_TOPIC;

  const { data } = await supabase
    .from("client_primary_topics")
    .select("topic_slug")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.topic_slug ?? DEFAULT_LOH_TOPIC;
}
