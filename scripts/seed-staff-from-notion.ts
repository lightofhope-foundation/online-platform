/**
 * Seed LOH staff accounts (Light of Hope Team only).
 * Usage: cd web && npx tsx scripts/seed-staff-from-notion.ts
 *
 * Destructive: deletes all auth users except keep-list, then creates staff.
 * Admin = Dincer only. No oag-media / Andreas G.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");

function loadEnv(): Record<string, string> {
  const text = readFileSync(ENV_PATH, "utf8");
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const PASSWORD = "LohStaff2026!";

type StaffRole = "therapist" | "setter" | "erstgespraechler" | "teamlead" | "admin";

type StaffSeed = {
  email: string;
  firstName: string;
  lastName: string;
  displayAlias: string | null;
  primary: StaffRole;
  extras: StaffRole[];
  note: string;
};

/** Nur LOH Team / Freelancer. Einziger Admin: Dincer. */
const STAFF: StaffSeed[] = [
  {
    email: "dincerb15@gmail.com",
    firstName: "Dincer",
    lastName: "Berberoglu",
    displayAlias: null,
    primary: "admin",
    extras: ["therapist", "teamlead", "setter", "erstgespraechler"],
    note: "einziger Admin",
  },
  {
    email: "teamleitung@demo.lightofhope.local",
    firstName: "Team",
    lastName: "Leitung",
    displayAlias: "Teamleitung",
    primary: "teamlead",
    extras: [],
    note: "Demo Teamleitung",
  },
  {
    email: "nathalie.siedka@gmail.com",
    firstName: "Nathalie",
    lastName: "Siedka",
    displayAlias: "Nathalie S.",
    primary: "setter",
    extras: ["erstgespraechler"],
    note: "Notion: EG'ler + Setter",
  },
  {
    email: "enisa@demo.lightofhope.local",
    firstName: "Enisa",
    lastName: "LOH",
    displayAlias: "Enisa",
    primary: "therapist",
    extras: [],
    note: "Notion: Therapeut",
  },
  {
    email: "elena@demo.lightofhope.local",
    firstName: "Elena",
    lastName: "LOH",
    displayAlias: "Elena",
    primary: "setter",
    extras: [],
    note: "Notion: Setter",
  },
  {
    email: "kimberly@demo.lightofhope.local",
    firstName: "Kimberly",
    lastName: "LOH",
    displayAlias: "Kimberly",
    primary: "setter",
    extras: [],
    note: "Notion: Setter",
  },
  {
    email: "sandra@demo.lightofhope.local",
    firstName: "Sandra",
    lastName: "LOH",
    displayAlias: "Sandra",
    primary: "setter",
    extras: ["erstgespraechler"],
    note: "Notion: Setter + EG'ler",
  },
  {
    email: "tommy@demo.lightofhope.local",
    firstName: "Tommy",
    lastName: "LOH",
    displayAlias: "Tommy",
    primary: "therapist",
    extras: ["erstgespraechler"],
    note: "Notion: Therapeut + EG'ler",
  },
  {
    email: "boris@demo.lightofhope.local",
    firstName: "Boris",
    lastName: "LOH",
    displayAlias: "Boris",
    primary: "therapist",
    extras: ["setter", "erstgespraechler", "teamlead"],
    note: "alle Rollen außer Admin",
  },
];

const KEEP_EMAILS = new Set(
  STAFF.map((s) => s.email.toLowerCase())
);

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) List & delete non-keep users
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  for (const u of listed.users) {
    const email = (u.email ?? "").toLowerCase();
    if (!email || KEEP_EMAILS.has(email)) continue;
    console.log("DELETE", email);
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error("  fail delete", email, error.message);
  }

  // 2) Upsert staff
  for (const s of STAFF) {
    const email = s.email.toLowerCase();
    console.log("UPSERT", email, s.primary, s.extras);

    const { data: existingPage } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = existingPage?.users.find(
      (u) => (u.email ?? "").toLowerCase() === email
    );

    let userId = existing?.id;
    if (userId) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: s.firstName,
          last_name: s.lastName,
        },
      });
      if (error) throw new Error(`update ${email}: ${error.message}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: s.firstName,
          last_name: s.lastName,
        },
      });
      if (error) throw new Error(`create ${email}: ${error.message}`);
      userId = data.user.id;
    }

    const { error: profErr } = await admin.from("profiles").upsert({
      user_id: userId!,
      role: s.primary,
      first_name: s.firstName,
      last_name: s.lastName,
      display_alias: s.displayAlias,
    });
    if (profErr) throw new Error(`profile ${email}: ${profErr.message}`);

    await admin.from("profile_extra_roles").delete().eq("user_id", userId!);
    for (const extra of s.extras) {
      const { error } = await admin.from("profile_extra_roles").upsert({
        user_id: userId!,
        role: extra,
      });
      if (error) throw new Error(`extra ${email} ${extra}: ${error.message}`);
    }
  }

  // 3) Write credentials block into .env.local
  const blockLines = [
    "",
    "# --- LOH Demo Staff Logins (lokal, nicht committen) — Passwort für alle: " +
      PASSWORD +
      " ---",
    `LOH_DEMO_PASSWORD=${PASSWORD}`,
  ];
  for (const s of STAFF) {
    const key = s.email
      .split("@")[0]
      .replace(/[^a-z0-9]+/gi, "_")
      .toUpperCase();
    blockLines.push(
      `LOH_LOGIN_${key}=${s.email} # ${s.displayAlias ?? s.firstName} | primary=${s.primary}` +
        (s.extras.length ? ` extras=${s.extras.join("+")}` : "") +
        ` | ${s.note}`
    );
  }
  blockLines.push("# --- Ende Demo Staff ---", "");

  let envText = readFileSync(ENV_PATH, "utf8");
  envText = envText.replace(
    /\n?# --- LOH Demo Staff Logins[\s\S]*?# --- Ende Demo Staff ---\n?/g,
    "\n"
  );
  writeFileSync(ENV_PATH, envText.trimEnd() + "\n" + blockLines.join("\n"), "utf8");

  console.log("Done. Credentials written to web/.env.local");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
