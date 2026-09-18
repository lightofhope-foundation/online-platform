/**
 * Fix mis-assigned Boris/Nathalie/Anna clients after bad parser headings.
 * Re-run seed against corrected JSON (upsert by email).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

// Re-use seed script logic by re-executing seed after fixing bogus therapist
const web = resolve(__dirname, "..");
spawnSync("npx", ["tsx", "scripts/seed-therapy-from-milanote.ts"], {
  cwd: web,
  stdio: "inherit",
  shell: true,
});

async function cleanupBogus() {
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
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const bogus = (data?.users ?? []).filter((u) => {
    const e = (u.email || "").toLowerCase();
    return (
      e.includes("haut.rein") ||
      e.includes("anna.erstmal") ||
      e.includes("nur.frauen")
    );
  });
  for (const u of bogus) {
    // move clients off first? seed should have reassigned by email.
    // delete bogus therapist if no clients left
    const { data: still } = await admin
      .from("clients")
      .select("user_id")
      .eq("therapist_user_id", u.id);
    if ((still ?? []).length === 0) {
      console.log("DELETE bogus therapist", u.email);
      await admin.auth.admin.deleteUser(u.id);
    } else {
      console.log("KEEP (still has clients)", u.email, still?.length);
    }
  }
}

cleanupBogus().catch(console.error);
