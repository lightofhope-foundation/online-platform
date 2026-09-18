/**
 * Import Milanote Lead-Vault month MD(s) → clients.intake_data (match by name).
 * Usage:
 *   npx tsx scripts/import-lead-vault-intakes.ts
 *   npx tsx scripts/import-lead-vault-intakes.ts ../loh-team/lead-vault
 *   npx tsx scripts/import-lead-vault-intakes.ts path/to/file.md
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  normalizePersonKey,
  parseLeadVaultMonthMarkdown,
} from "../src/lib/parseLeadVaultMd";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function collectMonthMarkdowns(root: string): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        walk(p);
        continue;
      }
      if (!name.endsWith(".md")) continue;
      if (/Mathias Arnold/i.test(name)) continue;
      out.push(p);
    }
  }
  walk(root);
  return out.sort();
}

function defaultVaultRoot(): string {
  return resolve(process.cwd(), "../loh-team/lead-vault");
}

function richness(intake: Record<string, unknown>): number {
  return ["problems", "goals", "expectations", "side_note", "phone", "email", "address"]
    .map((k) => String(intake[k] ?? "").trim().length)
    .reduce((a, b) => a + b, 0);
}

function monthOrder(p: string): number {
  const n = p.toLowerCase();
  const map: [RegExp, number][] = [
    [/januar/, 1],
    [/februar/, 2],
    [/märz|marz/, 3],
    [/april/, 4],
    [/mai/, 5],
    [/juni/, 6],
    [/juli|july/, 7],
    [/august/, 8],
    [/september/, 9],
    [/oktober/, 10],
    [/november/, 11],
    [/dezember/, 12],
  ];
  for (const [re, m] of map) if (re.test(n)) return m;
  return 99;
}

async function main() {
  const arg = process.argv[2] ? resolve(process.argv[2]) : defaultVaultRoot();
  if (!existsSync(arg)) {
    console.error("Path not found:", arg);
    process.exit(1);
  }

  const files = statSync(arg).isDirectory() ? collectMonthMarkdowns(arg) : [arg];
  if (!files.length) {
    console.error("No markdown files found");
    process.exit(1);
  }
  files.sort((a, b) => monthOrder(a) - monthOrder(b));
  console.log("Files:", files.length);
  files.forEach((f) => console.log(" -", f));

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, client_id")
    .eq("role", "client");
  if (error) throw error;

  const byKey = new Map<string, { user_id: string; client_id: string | null; label: string }>();
  for (const p of profiles ?? []) {
    const key = normalizePersonKey(p.first_name ?? "", p.last_name ?? "");
    if (!key) continue;
    byKey.set(key, {
      user_id: p.user_id,
      client_id: p.client_id,
      label: `${p.first_name} ${p.last_name}`,
    });
  }

  let parsedTotal = 0;
  let updated = 0;
  let matched = 0;
  let skippedEmpty = 0;
  let skippedPoorer = 0;
  const unmatched = new Set<string>();
  const updatedNames: string[] = [];

  for (const mdPath of files) {
    const people = parseLeadVaultMonthMarkdown(readFileSync(mdPath, "utf8"));
    parsedTotal += people.length;
    console.log(`\n=== ${mdPath} → ${people.length} leads ===`);

    for (const person of people) {
      const key = normalizePersonKey(person.firstName, person.lastName);
      const profile = byKey.get(key);
      if (!profile) {
        unmatched.add(person.name);
        continue;
      }
      matched++;

      const rich = richness(person.intake as Record<string, unknown>);
      if (rich < 20) {
        skippedEmpty++;
        continue;
      }

      const { data: existing } = await supabase
        .from("clients")
        .select("intake_data")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      const prev = (existing?.intake_data ?? {}) as Record<string, unknown>;
      const prevRich = richness(prev);
      if (prevRich > rich + 80 && String(prev.problems ?? "").length > 100) {
        skippedPoorer++;
        continue;
      }

      const merged = {
        ...prev,
        ...person.intake,
        source: "milanote-lead-vault",
        milanote_name: person.name,
        imported_at: new Date().toISOString(),
        imported_from:
          mdPath.replace(/\\/g, "/").split("/loh-team/").pop() ?? mdPath,
      };

      const now = new Date().toISOString();
      if (existing) {
        const { error: upErr } = await supabase
          .from("clients")
          .update({ intake_data: merged, updated_at: now })
          .eq("user_id", profile.user_id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from("clients").insert({
          user_id: profile.user_id,
          intake_data: merged,
          is_paid: false,
          access_revoked: false,
          created_at: now,
          updated_at: now,
        });
        if (insErr) throw insErr;
      }
      updated++;
      updatedNames.push(`${profile.label} (${rich}c)`);
    }
  }

  // How many clients have filled intake now?
  const { data: allClients } = await supabase
    .from("clients")
    .select("user_id, intake_data");
  let filled = 0;
  for (const c of allClients ?? []) {
    if (richness((c.intake_data ?? {}) as Record<string, unknown>) >= 20) filled++;
  }

  console.log(
    JSON.stringify(
      {
        files: files.length,
        parsedTotal,
        matched,
        updated,
        skippedEmpty,
        skippedPoorer,
        clientsWithFilledIntake: filled,
        unmatchedCount: unmatched.size,
        unmatchedSample: [...unmatched].slice(0, 40),
        updatedSample: updatedNames.slice(0, 50),
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
