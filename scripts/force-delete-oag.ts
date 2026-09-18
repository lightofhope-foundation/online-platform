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

const EMAIL = "info@oag-media.com";

async function main() {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const u = data?.users?.find((x) => (x.email || "").toLowerCase() === EMAIL);
  if (!u) {
    console.log("already gone");
    return;
  }
  const id = u.id;
  console.log("cleaning", id);

  const tables = [
    "audit_logs",
    "video_progress",
    "user_video_unlocks",
    "session_notes",
    "session_recordings",
    "client_sessions",
    "orbit_client_layouts",
    "lead_vault_boards",
    "clients",
    "profile_extra_roles",
    "profiles",
  ];

  // Null out actor refs
  await admin.from("audit_logs").update({ actor_id: null }).eq("actor_id", id);

  for (const t of tables) {
    const { error, count } = await admin
      .from(t)
      .delete({ count: "exact" })
      .eq("user_id", id);
    if (error && !/column|does not exist/i.test(error.message)) {
      // try therapist_user_id / actor patterns
      const r2 = await admin.from(t).delete({ count: "exact" }).eq("therapist_user_id", id);
      if (r2.error) console.log(t, error.message, r2.error.message);
      else console.log(t, "therapist cleaned", r2.count);
    } else {
      console.log(t, "cleaned", count, error?.message ?? "ok");
    }
  }

  // profiles again
  await admin.from("profiles").delete().eq("user_id", id);

  const { error } = await admin.auth.admin.deleteUser(id);
  console.log("deleteUser", error?.message ?? "ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
