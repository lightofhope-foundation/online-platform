import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      return m ? ([m[1], m[2].trim()] as const) : null;
    })
    .filter(Boolean) as [string, string][]
);

function rich(i: Record<string, unknown>) {
  return ["problems", "goals", "side_note", "phone", "email"]
    .map((k) => String(i[k] ?? "").length)
    .reduce((a, b) => a + b, 0);
}

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { count: clients } = await admin.from("clients").select("*", { count: "exact", head: true });
  const { data } = await admin.from("clients").select("intake_data");
  let filled = 0;
  let empty = 0;
  for (const c of data ?? []) {
    if (rich((c.intake_data ?? {}) as Record<string, unknown>) >= 20) filled++;
    else empty++;
  }
  console.log(JSON.stringify({ clients, filled, empty }));
}

main();
