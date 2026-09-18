/**
 * Ensure Dincer is the sole admin (first_name Dincer for dashboard greeting).
 */
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

const DINCER = "dincerb15@gmail.com";

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const dincer = data?.users?.find((u) => (u.email || "").toLowerCase() === DINCER);
  if (!dincer) throw new Error("Dincer not found");

  await admin
    .from("profiles")
    .update({
      role: "admin",
      first_name: "Dincer",
      last_name: "Berberoglu",
      display_alias: null,
    })
    .eq("user_id", dincer.id);

  for (const role of ["therapist", "teamlead", "setter", "erstgespraechler"] as const) {
    await admin.from("profile_extra_roles").upsert({ user_id: dincer.id, role });
  }

  const { data: admins } = await admin
    .from("profiles")
    .select("user_id, first_name, role")
    .eq("role", "admin");
  for (const a of admins ?? []) {
    const { data: au } = await admin.auth.admin.getUserById(a.user_id);
    console.log("admin", au.user?.email, a.first_name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
