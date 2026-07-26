/**
 * Seed Lead Vault (LV1): 10 test clients without platform access + nested Milanote boards.
 * Run: npm run seed:lead-vault
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

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
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const THERAPIST_EMAIL = "gretzinger.a@gmail.com";

type LeadSeed = {
  firstName: string;
  lastName: string;
  email: string;
  day: number; // April 2026
  intake: Record<string, unknown>;
};

const LEADS: LeadSeed[] = [
  {
    firstName: "Bettina",
    lastName: "Spahn",
    email: "lead.vault.bettina.spahn@loh-test.local",
    day: 8,
    intake: {
      setter_name: "Sumayya",
      closer_name: "EG Tommy",
      phone: "+4917646624111",
      email: "tina.marin@gmx.de",
      address: "Siedenkrog 4, 23730 Neustadt in Holstein DE",
      problems:
        "Depression diagnostiziert seit ca. 2008/2009. Gefühl von Leere, tiefe Einsamkeit, Kindheitsthemen, kürzlicher Verlust.",
      side_note: "46 Jahre alt, geschieden, Erzieherin. Maximal ca. 80–100€ monatlich möglich.",
      goals: "",
      expectations: "",
      consequences: "",
      value_tags: [],
      agreement_signed: false,
      platform_added: false,
    },
  },
  {
    firstName: "Klaus",
    lastName: "Meier",
    email: "lead.vault.klaus.meier@loh-test.local",
    day: 2,
    intake: {
      setter_name: "Sumayya",
      closer_name: "EG Tommy",
      phone: "+491701112233",
      email: "klaus.meier@example.com",
      problems: "Angstzustände nach Trennung, Schlafprobleme.",
      side_note: "52 Jahre, angestellt.",
    },
  },
  {
    firstName: "Anna",
    lastName: "Vogel",
    email: "lead.vault.anna.vogel@loh-test.local",
    day: 4,
    intake: {
      setter_name: "Sumayya",
      phone: "+491702223344",
      problems: "Trauma-Themen, Vermeidungsverhalten.",
    },
  },
  {
    firstName: "Markus",
    lastName: "Hoffmann",
    email: "lead.vault.markus.hoffmann@loh-test.local",
    day: 10,
    intake: {
      setter_name: "Sumayya",
      problems: "Burnout-Verdacht, Erschöpfung.",
    },
  },
  {
    firstName: "Lena",
    lastName: "Schneider",
    email: "lead.vault.lena.schneider@loh-test.local",
    day: 12,
    intake: {
      setter_name: "Sumayya",
      problems: "Depressive Episode, sozialer Rückzug.",
    },
  },
  {
    firstName: "Thomas",
    lastName: "Braun",
    email: "lead.vault.thomas.braun@loh-test.local",
    day: 15,
    intake: {
      setter_name: "Sumayya",
      problems: "Beziehungsprobleme, Wutimpulse.",
    },
  },
  {
    firstName: "Julia",
    lastName: "Weber",
    email: "lead.vault.julia.weber@loh-test.local",
    day: 18,
    intake: {
      setter_name: "Sumayya",
      problems: "Panikattacken, Arbeitssituation.",
    },
  },
  {
    firstName: "Michael",
    lastName: "Richter",
    email: "lead.vault.michael.richter@loh-test.local",
    day: 22,
    intake: {
      setter_name: "Sumayya",
      problems: "Verlustverarbeitung, Sinnkrise.",
    },
  },
  {
    firstName: "Sarah",
    lastName: "König",
    email: "lead.vault.sarah.koenig@loh-test.local",
    day: 25,
    intake: {
      setter_name: "Sumayya",
      problems: "Angst + Depression Mischbild.",
    },
  },
  {
    firstName: "Peter",
    lastName: "Neumann",
    email: "lead.vault.peter.neumann@loh-test.local",
    day: 30,
    intake: {
      setter_name: "Sumayya",
      problems: "Trauma Kindheit, Albträume.",
    },
  },
];

const MONTHS_2026 = [
  { title: "Januar - 26", month: 1 },
  { title: "Februar - 26", month: 2 },
  { title: "März - 26", month: 3 },
  { title: "April- 26", month: 4 },
  { title: "Mai - 26", month: 5 },
  { title: "Juni - 26", month: 6 },
  { title: "July-26", month: 7 },
];

async function findTherapistId(): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const match = list?.users?.find(
    (u) => u.email?.toLowerCase() === THERAPIST_EMAIL.toLowerCase()
  );
  if (!match) throw new Error(`Therapist ${THERAPIST_EMAIL} not found in auth`);
  return match.id;
}

async function ensureLeadClient(
  lead: LeadSeed,
  therapistUserId: string
): Promise<{ userId: string; clientId: string | null }> {
  const { data: existingList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = existingList?.users?.find(
    (u) => u.email?.toLowerCase() === lead.email.toLowerCase()
  );

  let userId = existing?.id;
  if (!userId) {
    const password = `NoLogin-${randomBytes(16).toString("hex")}`;
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: lead.email,
      password,
      email_confirm: true,
      user_metadata: { lead_vault_seed: true, no_platform_access: true },
    });
    if (error || !created.user) {
      throw new Error(`Create user ${lead.email}: ${error?.message}`);
    }
    userId = created.user.id;

    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      role: "client",
      first_name: lead.firstName,
      last_name: lead.lastName,
    });
    if (profileError) {
      throw new Error(`Profile ${lead.email}: ${profileError.message}`);
    }
  }

  const now = new Date().toISOString();
  const { data: clientRow } = await supabase
    .from("clients")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (clientRow) {
    await supabase
      .from("clients")
      .update({
        therapist_user_id: therapistUserId,
        access_revoked: true,
        is_paid: false,
        intake_data: lead.intake,
        updated_at: now,
      })
      .eq("user_id", userId);
  } else {
    await supabase.from("clients").insert({
      user_id: userId,
      therapist_user_id: therapistUserId,
      access_revoked: true,
      is_paid: false,
      intake_data: lead.intake,
      created_at: now,
      updated_at: now,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("user_id", userId)
    .single();

  return { userId, clientId: profile?.client_id ?? null };
}

async function insertBoard(row: {
  parent_id?: string | null;
  title: string;
  kind: string;
  accent?: string;
  icon_key?: string;
  pos_x: number;
  pos_y: number;
  sort_order?: number;
  client_user_id?: string | null;
  meta?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabase
    .from("lead_vault_boards")
    .insert({
      parent_id: row.parent_id ?? null,
      title: row.title,
      kind: row.kind,
      accent: row.accent ?? "green",
      icon_key: row.icon_key ?? "clipboard",
      pos_x: row.pos_x,
      pos_y: row.pos_y,
      sort_order: row.sort_order ?? 0,
      client_user_id: row.client_user_id ?? null,
      meta: row.meta ?? { seed: "lv1" },
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Board insert ${row.title}: ${error?.message}`);
  return data.id as string;
}

async function main() {
  console.log("Lead Vault seed starting…");

  const { count } = await supabase
    .from("lead_vault_boards")
    .select("id", { count: "exact", head: true })
    .contains("meta", { seed: "lv1" });

  if ((count ?? 0) > 0) {
    console.log("Existing LV1 seed found — deleting previous seed boards…");
    await supabase.from("lead_vault_boards").delete().contains("meta", { seed: "lv1" });
  }

  const therapistUserId = await findTherapistId();
  console.log("Therapist:", therapistUserId);

  const createdLeads: { lead: LeadSeed; userId: string }[] = [];
  for (const lead of LEADS) {
    const { userId, clientId } = await ensureLeadClient(lead, therapistUserId);
    createdLeads.push({ lead, userId });
    console.log(`  Client ${lead.firstName} ${lead.lastName} (${clientId}) — no access`);
  }

  // Also assign existing test clients if present
  const { data: existingClients } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, client_id")
    .in("client_id", ["01dibe003", "01tewe002"]);

  for (const p of existingClients ?? []) {
    const { data: existing } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", p.user_id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("clients")
        .update({
          therapist_user_id: therapistUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", p.user_id);
    } else {
      await supabase.from("clients").insert({
        user_id: p.user_id,
        therapist_user_id: therapistUserId,
        access_revoked: false,
        is_paid: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Root children
  await insertBoard({
    title: "Muster",
    kind: "template",
    accent: "green",
    pos_x: 40,
    pos_y: 40,
    sort_order: 0,
  });

  const monthIds = new Map<number, string>();
  MONTHS_2026.forEach((m, i) => {
    // filled below async — use loop
  });

  for (let i = 0; i < MONTHS_2026.length; i++) {
    const m = MONTHS_2026[i];
    const col = i % 4;
    const row = Math.floor(i / 4);
    const id = await insertBoard({
      title: m.title,
      kind: "month",
      accent: "green",
      pos_x: 180 + col * 160,
      pos_y: 40 + row * 160,
      sort_order: i + 1,
      meta: { seed: "lv1", year: 2026, month: m.month },
    });
    monthIds.set(m.month, id);
  }

  // Bottom row: Muster + Archives
  await insertBoard({
    title: "MUSTER",
    kind: "template",
    accent: "teal",
    icon_key: "alien",
    pos_x: 40,
    pos_y: 360,
    sort_order: 20,
  });
  await insertBoard({
    title: "Muster",
    kind: "template",
    accent: "orange",
    pos_x: 200,
    pos_y: 360,
    sort_order: 21,
  });
  await insertBoard({
    title: "ARCHIEV 2023",
    kind: "archive",
    accent: "yellow",
    icon_key: "folder",
    pos_x: 360,
    pos_y: 360,
    sort_order: 22,
    meta: { seed: "lv1", year: 2023 },
  });
  await insertBoard({
    title: "ARCHIEV 2024",
    kind: "archive",
    accent: "brown",
    icon_key: "rocket",
    pos_x: 520,
    pos_y: 360,
    sort_order: 23,
    meta: { seed: "lv1", year: 2024 },
  });
  await insertBoard({
    title: "ARCHIEV 2025",
    kind: "archive",
    accent: "green",
    icon_key: "mountain",
    pos_x: 680,
    pos_y: 360,
    sort_order: 24,
    meta: { seed: "lv1", year: 2025 },
  });

  const aprilId = monthIds.get(4)!;

  await insertBoard({
    parent_id: aprilId,
    title: "Muster '25",
    kind: "template",
    accent: "green",
    icon_key: "alien",
    pos_x: 40,
    pos_y: 80,
    sort_order: 0,
  });

  // Group leads by day
  const byDay = new Map<number, { lead: LeadSeed; userId: string }[]>();
  for (const item of createdLeads) {
    const list = byDay.get(item.lead.day) ?? [];
    list.push(item);
    byDay.set(item.lead.day, list);
  }

  // Add existing clients to some April days for demo density
  if (existingClients?.length) {
    const dincer = existingClients.find((c) => c.client_id?.toLowerCase() === "01dibe003");
    const teo = existingClients.find((c) => c.client_id?.toLowerCase() === "01tewe002");
    if (dincer) {
      const list = byDay.get(8) ?? [];
      list.push({
        lead: {
          firstName: dincer.first_name ?? "Dincer",
          lastName: dincer.last_name ?? "Berberoglu",
          email: "",
          day: 8,
          intake: {},
        },
        userId: dincer.user_id,
      });
      byDay.set(8, list);
    }
    if (teo) {
      const list = byDay.get(4) ?? [];
      list.push({
        lead: {
          firstName: teo.first_name ?? "Teo",
          lastName: teo.last_name ?? "Wester",
          email: "",
          day: 4,
          intake: {},
        },
        userId: teo.user_id,
      });
      byDay.set(4, list);
    }
  }

  // Create day boards for days that have leads + a few empty sample days
  const aprilDays = new Set([1, 2, 4, 8, 10, 12, 15, 18, 22, 25, 28, 30]);
  for (const item of createdLeads) aprilDays.add(item.lead.day);

  const sortedDays = [...aprilDays].sort((a, b) => a - b);
  let dayIndex = 0;
  for (const day of sortedDays) {
    const col = dayIndex % 6;
    const row = Math.floor(dayIndex / 6);
    dayIndex += 1;

    const dayTitle = `${String(day).padStart(2, "0")}.04`;
    const dayBoardId = await insertBoard({
      parent_id: aprilId,
      title: dayTitle,
      kind: "day",
      accent: "green",
      icon_key: "alien",
      pos_x: 200 + col * 140,
      pos_y: 80 + row * 150,
      sort_order: day,
      meta: { seed: "lv1", year: 2026, month: 4, day },
    });

    await insertBoard({
      parent_id: dayBoardId,
      title: "Muster",
      kind: "template",
      accent: "orange",
      pos_x: 40,
      pos_y: 80,
      sort_order: 0,
      meta: { seed: "lv1", template: true },
    });

    const leadColumnId = await insertBoard({
      parent_id: dayBoardId,
      title: "LEAD",
      kind: "column",
      accent: "white",
      pos_x: 220,
      pos_y: 60,
      sort_order: 1,
      meta: { seed: "lv1" },
    });

    const dayLeads = byDay.get(day) ?? [];
    for (let i = 0; i < dayLeads.length; i++) {
      const { lead, userId } = dayLeads[i];
      await insertBoard({
        parent_id: leadColumnId,
        title: `${lead.firstName} ${lead.lastName}`,
        kind: "lead",
        accent: "orange",
        icon_key: "clipboard",
        pos_x: 16,
        pos_y: 48 + i * 120,
        sort_order: i,
        client_user_id: userId,
        meta: { seed: "lv1", day },
      });
    }
  }

  console.log("Lead Vault seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
