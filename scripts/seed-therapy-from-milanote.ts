/**
 * Seed therapists + clients from Milanote Therapie-Plätze snapshot.
 * Assigns clients to therapists. Writes credentials to .env.local.
 *
 * Usage: cd web && npx tsx scripts/seed-therapy-from-milanote.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const ENV_PATH = resolve(__dirname, "../.env.local");
const SNAPSHOT = resolve(
  ROOT,
  "knowledge/milanote-therapie-plaetze-2026-09-18.json"
);

const THERAPIST_PASSWORD = "LohStaff2026!";
const CLIENT_PASSWORD = "LohClient2026!";

type SnapClient = {
  name: string;
  inactive_or_paused: boolean;
  raw: string;
};
type SnapTherapist = {
  therapist: string;
  capacity: number | null;
  notes: string[];
  clients: SnapClient[];
  section: string;
};
type Snapshot = {
  therapists: SnapTherapist[];
};

function loadEnv(): Record<string, string> {
  const text = readFileSync(ENV_PATH, "utf8");
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48);
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Klient", last: "Unbekannt" };
  if (parts.length === 1) return { first: parts[0], last: "—" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Map Milanote display names → existing LOH staff emails when known */
const THERAPIST_EMAIL_MAP: Record<string, string> = {
  boris: "boris@demo.lightofhope.local",
  enisa: "enisa@demo.lightofhope.local",
  sandra: "sandra@demo.lightofhope.local",
  nathalie: "nathalie.siedka@gmail.com",
  anna: "anna@therapist.lightofhope.local",
  julie: "julie@therapist.lightofhope.local",
  soliyana: "soliyana@therapist.lightofhope.local",
  klaudija: "klaudija@therapist.lightofhope.local",
  marla: "marla@therapist.lightofhope.local",
  mert: "mert@therapist.lightofhope.local",
  kevin: "kevin@therapist.lightofhope.local",
  omer: "omer@therapist.lightofhope.local",
  ömer: "omer@therapist.lightofhope.local",
};

function therapistEmail(displayName: string): string {
  const key = displayName.trim().toLowerCase();
  // "Nathalie -  8 Plätze..." already parsed as "Nathalie - ..."
  const short = key.split(/\s+/)[0];
  if (THERAPIST_EMAIL_MAP[key]) return THERAPIST_EMAIL_MAP[key];
  if (THERAPIST_EMAIL_MAP[short]) return THERAPIST_EMAIL_MAP[short];
  if (key.startsWith("nathalie")) return "nathalie.siedka@gmail.com";
  // Skip non-person sections
  return `${slugify(displayName)}@therapist.lightofhope.local`;
}

function shouldSkipTherapist(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("alt nicht mehr") ||
    n.includes("bereits voll") ||
    n === "muster"
  );
}

async function findUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string; email: string } | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
  return u ? { id: u.id, email: u.email! } : null;
}

async function ensureTherapist(
  admin: SupabaseClient,
  displayName: string
): Promise<{ userId: string; email: string; created: boolean }> {
  const email = therapistEmail(displayName);
  const existing = await findUserByEmail(admin, email);
  const { first, last } = splitName(
    displayName.replace(/\s*-\s*$/, "").trim() || displayName
  );
  const alias = displayName.split("-")[0].trim() || displayName;

  if (existing) {
    await admin
      .from("profiles")
      .upsert({
        user_id: existing.id,
        role: "therapist",
        first_name: first,
        last_name: last === "—" ? "" : last,
        display_alias: alias,
      });
    // keep existing extras; ensure therapist primary
    await admin.auth.admin.updateUserById(existing.id, {
      password: THERAPIST_PASSWORD,
      email_confirm: true,
    });
    return { userId: existing.id, email, created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: THERAPIST_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: first, last_name: last },
  });
  if (error) throw new Error(`therapist ${email}: ${error.message}`);
  const userId = data.user.id;
  const { error: pErr } = await admin.from("profiles").upsert({
    user_id: userId,
    role: "therapist",
    first_name: first,
    last_name: last === "—" ? "" : last,
    display_alias: alias,
  });
  if (pErr) throw new Error(`profile ${email}: ${pErr.message}`);
  return { userId, email, created: true };
}

async function ensureClient(
  admin: SupabaseClient,
  fullName: string,
  therapistUserId: string,
  inactive: boolean
): Promise<{ userId: string; email: string; clientId: string | null; created: boolean }> {
  const slug = slugify(fullName) || `client.${Date.now()}`;
  const email = `${slug}@client.lightofhope.local`;
  const { first, last } = splitName(fullName);
  const existing = await findUserByEmail(admin, email);

  let userId: string;
  let created = false;
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password: CLIENT_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: first, last_name: last },
    });
    if (error) throw new Error(`client ${email}: ${error.message}`);
    userId = data.user.id;
    created = true;
  }

  const { error: pErr } = await admin.from("profiles").upsert({
    user_id: userId,
    role: "client",
    first_name: first,
    last_name: last === "—" ? "" : last,
    display_alias: fullName,
  });
  if (pErr) throw new Error(`client profile ${email}: ${pErr.message}`);

  const now = new Date().toISOString();
  const { data: existingClient } = await admin
    .from("clients")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    therapist_user_id: therapistUserId,
    is_paid: false,
    access_revoked: false,
    archived_at: inactive ? now : null,
    intake_data: {
      source: "milanote_therapie_plaetze_2026-09-18",
      milanote_name: fullName,
      inactive_or_paused: inactive,
    },
    updated_at: now,
  };

  if (existingClient) {
    const { error } = await admin.from("clients").update(payload).eq("user_id", userId);
    if (error) throw new Error(`client update ${email}: ${error.message}`);
  } else {
    const { error } = await admin.from("clients").insert({
      ...payload,
      created_at: now,
    });
    if (error) throw new Error(`client insert ${email}: ${error.message}`);
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("client_id")
    .eq("user_id", userId)
    .single();

  return {
    userId,
    email,
    clientId: prof?.client_id ?? null,
    created,
  };
}

async function main() {
  const env = loadEnv();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as Snapshot;
  const credLines: string[] = [
    "",
    "# --- LOH Therapy Seed (Milanote Therapie-Plätze 18.09.2026) ---",
    `LOH_THERAPIST_PASSWORD=${THERAPIST_PASSWORD}`,
    `LOH_CLIENT_PASSWORD=${CLIENT_PASSWORD}`,
  ];

  let tCreated = 0;
  let cCreated = 0;
  let cUpdated = 0;

  for (const block of snap.therapists) {
    if (shouldSkipTherapist(block.therapist)) {
      console.log("SKIP therapist block", block.therapist);
      continue;
    }
    // "Anna alt nicht mehr bei uns" has no clients typically - skip empty-ish
    const name = block.therapist.trim();
    console.log("\n===", name, `(${block.clients.length} clients)`);

    const th = await ensureTherapist(admin, name);
    if (th.created) tCreated++;
    credLines.push(
      `LOH_THERAPIST_${slugify(name).replace(/\./g, "_").toUpperCase()}=${th.email} # ${name} | ${block.clients.length} Klienten | pw=${THERAPIST_PASSWORD}`
    );

    for (const cl of block.clients) {
      try {
        const res = await ensureClient(
          admin,
          cl.name,
          th.userId,
          cl.inactive_or_paused
        );
        if (res.created) cCreated++;
        else cUpdated++;
        credLines.push(
          `LOH_CLIENT_${slugify(cl.name).replace(/\./g, "_").toUpperCase()}=${res.email} # ${cl.name} → ${name}` +
            (cl.inactive_or_paused ? " (pausiert)" : "") +
            ` | pw=${CLIENT_PASSWORD}`
        );
        console.log(
          `  ${res.created ? "NEW" : "UPD"} ${cl.name} → ${th.email}`
        );
      } catch (e) {
        console.error("  FAIL", cl.name, e);
      }
    }
  }

  credLines.push("# --- Ende Therapy Seed ---", "");

  let envText = readFileSync(ENV_PATH, "utf8");
  envText = envText.replace(
    /\n?# --- LOH Therapy Seed[\s\S]*?# --- Ende Therapy Seed ---\n?/g,
    "\n"
  );
  writeFileSync(ENV_PATH, envText.trimEnd() + "\n" + credLines.join("\n"), "utf8");

  console.log("\nDone.", { tCreated, cCreated, cUpdated });
  console.log("Credentials appended to web/.env.local");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
