/**
 * Set Boris to all roles except admin: therapist + setter + erstgespraechler + teamlead
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const ENV_PATH = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .map((l) => {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      return m ? ([m[1], m[2].trim()] as const) : null;
    })
    .filter(Boolean) as [string, string][]
);

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listed, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const boris = listed.users.find(
    (u) => (u.email || "").toLowerCase() === "boris@demo.lightofhope.local"
  );
  if (!boris) throw new Error("Boris not found");

  const { error: pErr } = await admin
    .from("profiles")
    .update({ role: "therapist", display_alias: "Boris" })
    .eq("user_id", boris.id);
  if (pErr) throw pErr;

  await admin.from("profile_extra_roles").delete().eq("user_id", boris.id);
  for (const role of ["setter", "erstgespraechler", "teamlead"] as const) {
    const { error: e } = await admin
      .from("profile_extra_roles")
      .upsert({ user_id: boris.id, role });
    if (e) throw e;
  }

  const { data: extras } = await admin
    .from("profile_extra_roles")
    .select("role")
    .eq("user_id", boris.id);
  console.log("Boris OK", boris.email, "primary=therapist extras=", extras?.map((x) => x.role));

  // also update .env.local note for Boris
  let text = readFileSync(ENV_PATH, "utf8");
  text = text.replace(
    /LOH_LOGIN_BORIS=.*/,
    "LOH_LOGIN_BORIS=boris@demo.lightofhope.local # Boris | primary=therapist extras=setter+erstgespraechler+teamlead | alle Rollen außer Admin"
  );
  const { writeFileSync } = await import("fs");
  writeFileSync(ENV_PATH, text, "utf8");
  console.log("env note updated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
