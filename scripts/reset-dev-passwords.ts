/**
 * Reset passwords for all auth users except dincer@web.de → Hallo123!
 * Also clears bans so accounts can log in again.
 * Run: npx tsx scripts/reset-dev-passwords.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PASSWORD = "Hallo123!";
const SKIP = new Set(["dincer@web.de"]);

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  for (const user of data.users) {
    const email = (user.email ?? "").toLowerCase();
    if (!email || SKIP.has(email)) {
      console.log(`SKIP ${email || user.id}`);
      continue;
    }

    const { error: updError } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      ban_duration: "none",
    });
    if (updError) {
      console.error(`FAIL ${email}: ${updError.message}`);
    } else {
      console.log(`OK   ${email}`);
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
