import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AccessLevelOption = {
  access_level: number;
  label: string;
  description: string | null;
};

export function formatAccessLevelLabel(
  level: number,
  options?: AccessLevelOption[]
): string {
  const match = options?.find((o) => o.access_level === level);
  return match?.label ?? `Stufe ${level}`;
}

export async function fetchAccessLevelOptions(): Promise<AccessLevelOption[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("platform_access_levels")
    .select("access_level, label, description")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchAccessLevelOptions:", error);
    return Array.from({ length: 6 }, (_, i) => ({
      access_level: i,
      label: `Stufe ${i}`,
      description: null,
    }));
  }

  if (!data?.length) {
    return Array.from({ length: 6 }, (_, i) => ({
      access_level: i,
      label: `Stufe ${i}`,
      description: null,
    }));
  }

  return data;
}
