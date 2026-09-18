/**
 * Read-only Notion Meta (= Pipeline Pro / Meta) → LOH Setter Leadboard + Kundenkarte.
 * Never writes to Notion. Token only server-side.
 *
 * Meta DB ~1318 Kontakte. Leadboard lädt absichtlich nur die zuletzt bearbeiteten
 * (Default 150), damit der Demo-Abruf schnell bleibt.
 */

export const NOTION_META_DATABASE_ID = "3208dde6-efe8-805f-8370-c2f7ba664f2e";
/** Geschätzte Gesamtzahl in Notion Meta / Pipeline Pro (Stand Knowledge Sep 2026). */
export const NOTION_META_APPROX_TOTAL = 1318;
const NOTION_VERSION = "2022-06-28";

export type NotionMetaLead = {
  id: string;
  name: string;
  status: string | null;
  statusSet: string | null;
  statusEg: string | null;
  setter: string | null;
  eg: string | null;
  therapist: string | null;
  rp: boolean | null;
  rpSelect: string | null;
  terminatedAt: string | null;
  lastEdited: string | null;
  url: string | null;
};

export type NotionLeadField = {
  key: string;
  value: string;
};

export type NotionMetaLeadDetail = NotionMetaLead & {
  fields: NotionLeadField[];
  createdTime: string | null;
  archived: boolean;
};

type NotionProp = {
  type?: string;
  title?: { plain_text?: string }[];
  rich_text?: { plain_text?: string }[];
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  multi_select?: { name?: string }[];
  checkbox?: boolean;
  number?: number | null;
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  date?: { start?: string | null; end?: string | null } | null;
  people?: { name?: string | null }[];
  files?: {
    name?: string;
    type?: string;
    file?: { url?: string };
    external?: { url?: string };
  }[];
  formula?: {
    type?: string;
    string?: string | null;
    number?: number | null;
    boolean?: boolean | null;
    date?: { start?: string | null } | null;
  };
  relation?: { id?: string }[];
  rollup?: { type?: string; number?: number | null; array?: unknown[] };
  created_time?: string;
  last_edited_time?: string;
  created_by?: { name?: string | null };
  last_edited_by?: { name?: string | null };
};

function plainText(chunks: { plain_text?: string }[] | undefined): string {
  return (chunks ?? []).map((x) => x.plain_text ?? "").join("").trim();
}

function plainTitle(props: Record<string, NotionProp>): string {
  for (const p of Object.values(props)) {
    if (p?.type === "title") {
      const t = plainText(p.title);
      if (t) return t;
    }
  }
  return "(ohne Titel)";
}

function peopleNames(prop: NotionProp | undefined): string | null {
  if (!prop || prop.type !== "people") return null;
  const names = (prop.people ?? [])
    .map((p) => (p.name ?? "").trim())
    .filter(Boolean);
  return names.length ? names.join(", ") : null;
}

function statusName(prop: NotionProp | undefined): string | null {
  if (!prop) return null;
  if (prop.type === "status") return prop.status?.name ?? null;
  if (prop.type === "select") return prop.select?.name ?? null;
  return null;
}

/** Notion/Sheets-Rohwerte lesbar machen (Anzeige only, Daten bleiben roh). */
function humanizeDisplayValue(raw: string, propType?: string): string {
  let v = raw.trim();
  if (!v) return v;

  // Telefon aus Sheets-Import: "p:+49…"
  if (/^p:/i.test(v) && /[\d+]/.test(v)) {
    v = v.replace(/^p:/i, "").trim();
  }

  // ISO-Timestamps (created_time / last_edited_time / date strings)
  if (
    propType === "created_time" ||
    propType === "last_edited_time" ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)
  ) {
    try {
      return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Berlin",
      }).format(new Date(v));
    } catch {
      /* keep */
    }
  }

  // Datum YYYY-MM-DD (ohne Uhrzeit)
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    try {
      return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeZone: "Europe/Berlin",
      }).format(new Date(`${v}T12:00:00Z`));
    } catch {
      /* keep */
    }
  }

  // Select-/Status-Slugs: bitte_zuerst_per_whatsapp → bitte zuerst per whatsapp
  if (
    (propType === "select" ||
      propType === "status" ||
      propType === "multi_select" ||
      /_/.test(v)) &&
    !/^https?:\/\//i.test(v) &&
    !v.includes("@")
  ) {
    v = v
      .replace(/_/g, " ")
      .replace(/\s+\/\s+/g, " / ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Kurze Plattform-Codes
  const platformMap: Record<string, string> = {
    fb: "Facebook",
    ig: "Instagram",
    tt: "TikTok",
    google: "Google",
    meta: "Meta",
  };
  const lower = v.toLowerCase();
  if (platformMap[lower]) return platformMap[lower];

  return v;
}

function formatPropValue(prop: NotionProp | undefined): string | null {
  if (!prop?.type) return null;
  let raw: string | null = null;
  switch (prop.type) {
    case "title": {
      const t = plainText(prop.title);
      raw = t || null;
      break;
    }
    case "rich_text": {
      const t = plainText(prop.rich_text);
      raw = t || null;
      break;
    }
    case "select":
      raw = prop.select?.name ?? null;
      break;
    case "status":
      raw = prop.status?.name ?? null;
      break;
    case "multi_select": {
      const names = (prop.multi_select ?? []).map((x) => x.name).filter(Boolean);
      raw = names.length ? names.join(", ") : null;
      break;
    }
    case "people":
      raw = peopleNames(prop);
      break;
    case "checkbox":
      raw = prop.checkbox ? "Ja" : "Nein";
      break;
    case "number":
      raw = prop.number == null ? null : String(prop.number);
      break;
    case "url":
      raw = prop.url?.trim() || null;
      break;
    case "email":
      raw = prop.email?.trim() || null;
      break;
    case "phone_number":
      raw = prop.phone_number?.trim() || null;
      break;
    case "date": {
      if (!prop.date?.start) {
        raw = null;
        break;
      }
      raw = prop.date.end
        ? `${prop.date.start} – ${prop.date.end}`
        : prop.date.start;
      break;
    }
    case "files": {
      const names = (prop.files ?? [])
        .map((f) => f.name || f.file?.url || f.external?.url || "")
        .filter(Boolean);
      raw = names.length ? names.join(", ") : null;
      break;
    }
    case "formula": {
      const f = prop.formula;
      if (!f) {
        raw = null;
        break;
      }
      if (f.type === "string") raw = f.string?.trim() || null;
      else if (f.type === "number")
        raw = f.number == null ? null : String(f.number);
      else if (f.type === "boolean") raw = f.boolean ? "Ja" : "Nein";
      else if (f.type === "date") raw = f.date?.start ?? null;
      else raw = null;
      break;
    }
    case "relation": {
      const n = prop.relation?.length ?? 0;
      raw = n ? `${n} Verknüpfung${n === 1 ? "" : "en"}` : null;
      break;
    }
    case "rollup": {
      if (prop.rollup?.type === "number" && prop.rollup.number != null) {
        raw = String(prop.rollup.number);
      } else {
        const n = prop.rollup?.array?.length ?? 0;
        raw = n ? `${n} Einträge` : null;
      }
      break;
    }
    case "created_time":
      raw = prop.created_time ?? null;
      break;
    case "last_edited_time":
      raw = prop.last_edited_time ?? null;
      break;
    case "created_by":
      raw = prop.created_by?.name ?? null;
      break;
    case "last_edited_by":
      raw = prop.last_edited_by?.name ?? null;
      break;
    default:
      raw = null;
  }
  if (raw == null || raw === "") return null;
  // Titel nicht „entschlüsseln“ — Fancy-Unicode bewusst belassen
  if (prop.type === "title") return raw;
  return humanizeDisplayValue(raw, prop.type);
}

function mapAllFields(props: Record<string, NotionProp>): NotionLeadField[] {
  const fields: NotionLeadField[] = [];
  for (const [key, prop] of Object.entries(props)) {
    const value = formatPropValue(prop);
    if (value == null || value === "") continue;
    fields.push({ key, value });
  }
  fields.sort((a, b) => a.key.localeCompare(b.key, "de"));
  return fields;
}

function mapPage(page: {
  id: string;
  url?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProp>;
}): NotionMetaLead {
  const props = page.properties ?? {};
  return {
    id: page.id,
    name: plainTitle(props),
    status: statusName(props.Status),
    statusSet: statusName(props["Status SET"]),
    statusEg: statusName(props["Status EG"]),
    setter: peopleNames(props.Setter),
    eg: peopleNames(props.EG),
    therapist:
      props.Therapeut?.type === "select"
        ? props.Therapeut.select?.name ?? null
        : null,
    rp: props.RP?.type === "checkbox" ? Boolean(props.RP.checkbox) : null,
    rpSelect:
      props["RP."]?.type === "select" ? props["RP."].select?.name ?? null : null,
    terminatedAt:
      props.Terminiert?.type === "date"
        ? props.Terminiert.date?.start ?? null
        : null,
    lastEdited: page.last_edited_time ?? null,
    url: page.url ?? null,
  };
}

type NotionQueryResult = {
  results?: {
    id: string;
    url?: string;
    last_edited_time?: string;
    properties?: Record<string, NotionProp>;
  }[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type NotionPageResult = {
  id: string;
  url?: string;
  archived?: boolean;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProp>;
  object?: string;
};

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export function notionLeadDetailPath(id: string): string {
  return `/setter/leadboard/${encodeURIComponent(id)}`;
}

/**
 * Unberührt = noch kein Setter/EG/Termin, Status (SET) leer oder „Neuer Kontakt“, nicht Lost.
 * → erscheinen unter „Offene Leads“ (Notion), ohne LOH-Auth-User anzulegen.
 */
export function isUntouchedMetaLead(lead: NotionMetaLead): boolean {
  if (lead.setter?.trim()) return false;
  if (lead.eg?.trim()) return false;
  if (lead.terminatedAt) return false;
  if (
    [lead.statusSet, lead.statusEg, lead.status].some((s) =>
      /lost/i.test(s ?? "")
    )
  ) {
    return false;
  }
  const set = (lead.statusSet ?? "").trim().toLowerCase();
  const st = (lead.status ?? "").trim().toLowerCase();
  const setOk = !set || set === "neuer kontakt" || set === "ohne status";
  const stOk = !st || st === "neuer kontakt";
  return setOk && stOk;
}

const FETCH_ALL_SAFETY_CAP = 5000;

/** `limit: "all"` lädt die komplette Meta-DB (Pagination). */
export async function fetchMetaLeads(
  limit: number | "all" = "all"
): Promise<{
  leads: NotionMetaLead[];
  error: string | null;
  fetchedAt: string;
  truncated: boolean;
}> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.NOTION_ACCESS_TOKEN?.trim();
  if (!token) {
    return {
      leads: [],
      error: "NOTION_ACCESS_TOKEN fehlt in der Server-Umgebung.",
      fetchedAt,
      truncated: false,
    };
  }

  const fetchAll = limit === "all";
  const target = fetchAll
    ? FETCH_ALL_SAFETY_CAP
    : Math.min(Math.max(limit, 1), FETCH_ALL_SAFETY_CAP);
  const leads: NotionMetaLead[] = [];
  let cursor: string | null = null;
  let truncated = false;

  try {
    while (leads.length < target) {
      const pageSize = Math.min(100, target - leads.length);
      const res = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_META_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: notionHeaders(token),
          body: JSON.stringify({
            page_size: pageSize,
            start_cursor: cursor ?? undefined,
            sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
          }),
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const body = await res.text();
        return {
          leads,
          error: `Notion API ${res.status}: ${body.slice(0, 280)}`,
          fetchedAt,
          truncated,
        };
      }

      const json = (await res.json()) as NotionQueryResult;
      leads.push(...(json.results ?? []).map(mapPage));
      if (!json.has_more || !json.next_cursor) break;
      cursor = json.next_cursor;
      if (leads.length >= target && json.has_more) {
        truncated = true;
        break;
      }
    }

    return { leads, error: null, fetchedAt, truncated };
  } catch (e) {
    return {
      leads,
      error: e instanceof Error ? e.message : "Unbekannter Notion-Fehler",
      fetchedAt,
      truncated,
    };
  }
}

/** Einzelne Notion-Page (Meta) inkl. aller Properties — nur Lesen. */
export async function fetchMetaLeadById(pageId: string): Promise<{
  lead: NotionMetaLeadDetail | null;
  error: string | null;
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.NOTION_ACCESS_TOKEN?.trim();
  if (!token) {
    return {
      lead: null,
      error: "NOTION_ACCESS_TOKEN fehlt in der Server-Umgebung.",
      fetchedAt,
    };
  }

  const id = pageId.trim();
  if (!id) {
    return { lead: null, error: "Ungültige Lead-ID.", fetchedAt };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "GET",
      headers: notionHeaders(token),
      cache: "no-store",
    });

    if (res.status === 404) {
      return { lead: null, error: null, fetchedAt };
    }

    if (!res.ok) {
      const body = await res.text();
      return {
        lead: null,
        error: `Notion API ${res.status}: ${body.slice(0, 280)}`,
        fetchedAt,
      };
    }

    const page = (await res.json()) as NotionPageResult;
    if (page.object && page.object !== "page") {
      return { lead: null, error: "Notion-Objekt ist keine Page.", fetchedAt };
    }

    const base = mapPage(page);
    return {
      lead: {
        ...base,
        fields: mapAllFields(page.properties ?? {}),
        createdTime: page.created_time ?? null,
        archived: Boolean(page.archived),
      },
      error: null,
      fetchedAt,
    };
  } catch (e) {
    return {
      lead: null,
      error: e instanceof Error ? e.message : "Unbekannter Notion-Fehler",
      fetchedAt,
    };
  }
}
