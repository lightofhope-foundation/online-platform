/**
 * Remove non-LOH accounts: info@oag-media.com + Andreas G. (gretzinger.a@gmail.com).
 * Ensures Dincer is admin with first_name Dincer.
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

const REMOVE = ["info@oag-media.com", "gretzinger.a@gmail.com"];
const DINCER = "dincerb15@gmail.com";

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  for (const email of REMOVE) {
    const u = users.find((x) => (x.email || "").toLowerCase() === email);
    if (!u) {
      console.log("not found", email);
      continue;
    }

    // Unassign clients
    const { count } = await admin
      .from("clients")
      .update({ therapist_user_id: null, updated_at: new Date().toISOString() })
      .eq("therapist_user_id", u.id)
      .select("*", { count: "exact", head: true });
    console.log(email, "unassigned clients", count);

    await admin.from("profile_extra_roles").delete().eq("user_id", u.id);
    await admin.from("profiles").delete().eq("user_id", u.id);
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error("delete auth", email, error.message);
    else console.log("deleted", email, u.id);
  }

  const dincer = users.find((x) => (x.email || "").toLowerCase() === DINCER);
  if (!dincer) throw new Error("Dincer missing");

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

  const { data: p } = await admin
    .from("profiles")
    .select("role, first_name, last_name, display_alias")
    .eq("user_id", dincer.id)
    .single();
  console.log("dincer profile", p);

  const { data: admins } = await admin.from("profiles").select("user_id, role, first_name").eq("role", "admin");
  for (const a of admins ?? []) {
    const { data: au } = await admin.auth.admin.getUserById(a.user_id);
    console.log("remaining admin", au.user?.email, a.first_name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
