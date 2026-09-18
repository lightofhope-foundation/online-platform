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
const OAG = "info@oag-media.com";

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  const dincer = users.find((u) => (u.email || "").toLowerCase() === DINCER);
  const oag = users.find((u) => (u.email || "").toLowerCase() === OAG);

  if (!dincer) throw new Error("Dincer not found");
  if (!oag) throw new Error("oag-media not found");

  // Dincer → primary admin; keep therapist + teamlead as extras; add setter+eg for demos
  await admin.from("profiles").update({ role: "admin" }).eq("user_id", dincer.id);
  for (const role of ["therapist", "teamlead", "setter", "erstgespraechler"] as const) {
    await admin.from("profile_extra_roles").upsert({
      user_id: dincer.id,
      role,
    });
  }

  // oag-media → no longer admin (demote to therapist, no extras)
  await admin.from("profiles").update({ role: "therapist" }).eq("user_id", oag.id);
  await admin.from("profile_extra_roles").delete().eq("user_id", oag.id);

  const { data: dP } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", dincer.id)
    .single();
  const { data: dX } = await admin
    .from("profile_extra_roles")
    .select("role")
    .eq("user_id", dincer.id);
  const { data: oP } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", oag.id)
    .single();

  console.log(
    JSON.stringify(
      {
        dincer: { email: DINCER, role: dP?.role, extras: dX?.map((x) => x.role) },
        oag: { email: OAG, role: oP?.role },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
