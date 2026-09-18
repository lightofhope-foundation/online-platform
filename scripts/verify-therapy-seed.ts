import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf8")
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
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  for (const u of users) {
    const e = (u.email || "").toLowerCase();
    if (e.includes("haut.rein") || e.includes("anna.erstmal")) {
      const { count } = await admin
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("therapist_user_id", u.id);
      console.log("bogus", e, "clients", count);
      if (!count) {
        await admin.auth.admin.deleteUser(u.id);
        console.log("  deleted");
      }
    }
  }

  for (const email of [
    "boris@demo.lightofhope.local",
    "nathalie.siedka@gmail.com",
    "anna@therapist.lightofhope.local",
    "soliyana@therapist.lightofhope.local",
  ]) {
    const u = users.find((x) => (x.email || "").toLowerCase() === email);
    if (!u) {
      console.log(email, "MISSING");
      continue;
    }
    const { count } = await admin
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("therapist_user_id", u.id);
    console.log(email, "→", count, "clients");
  }

  const { count: clients } = await admin
    .from("clients")
    .select("*", { count: "exact", head: true });
  const { count: therapists } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "therapist");
  console.log("totals clients=", clients, "therapist profiles=", therapists);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
