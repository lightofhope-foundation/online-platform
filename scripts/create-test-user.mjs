import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const EMAIL = "test@web.de";
const PASSWORD = "Hallo123!";
const FIRST_NAME = "Test";
const LAST_NAME = "Web";

async function main() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email?.toLowerCase() === EMAIL);
  let userId = found?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Created auth user:", userId);
  } else {
    await supabase.auth.admin.updateUserById(userId, { password: PASSWORD });
    console.log("Auth user already exists, password updated:", userId);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, client_id, role, first_name, last_name, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: userId,
      role: "client",
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
    });
    if (insertError) throw insertError;
    console.log("Inserted profile (triggers assign client_id + unlock schedule)");
  } else if (profile.role !== "client") {
    throw new Error(`Profile exists with role ${profile.role}, expected client`);
  } else {
    console.log("Profile exists:", profile.client_id);
    const { error: seedError } = await supabase.rpc("seed_user_video_unlocks", {
      p_user_id: userId,
    });
    if (seedError) throw seedError;
    console.log("Re-ran seed_user_video_unlocks");
  }

  const { data: refreshed } = await supabase
    .from("profiles")
    .select("user_id, client_id, role, first_name, last_name, created_at")
    .eq("user_id", userId)
    .single();

  const { data: unlocks } = await supabase
    .from("user_video_unlocks")
    .select("global_position, unlock_at, source")
    .eq("user_id", userId)
    .order("global_position");

  console.log("\n--- Test user ready ---");
  console.log("Email:", EMAIL);
  console.log("Password:", PASSWORD);
  console.log("Nutzer-ID:", refreshed?.client_id);
  console.log("Registered:", refreshed?.created_at);
  console.log("Unlock rows (videos 4+):", unlocks?.length ?? 0);
  unlocks?.forEach((u) => {
    console.log(`  Video ${u.global_position}: ${u.unlock_at} (${u.source})`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
