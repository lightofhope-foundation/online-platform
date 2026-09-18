/**
 * Read-only Notion Meta DB → LOH Setter Leadboard (demo).
 * Never writes to Notion. Token only server-side.
 */

export const NOTION_META_DATABASE_ID = "3208dde6-efe8-805f-8370-c2f7ba664f2e";
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
  url: string | null;
};

type NotionProp = {
  type?: string;
  title?: { plain_text?: string }[];
  rich_text?: { plain_text?: string }[];
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  checkbox?: boolean;
  date?: { start?: string | null } | null;
  people?: { name?: string | null }[];
};

function plainTitle(props: Record<string, NotionProp>): string {
  for (const p of Object.values(props)) {
    if (p?.type === "title") {
      const t = (p.title ?? []).map((x) => x.plain_text ?? "").join("").trim();
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

function mapPage(page: {
  id: string;
  url?: string;
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
    url: page.url ?? null,
  };
}

export async function fetchMetaLeads(limit = 40): Promise<{
  leads: NotionMetaLead[];
  error: string | null;
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();
  const token = process.env.NOTION_ACCESS_TOKEN?.trim();
  if (!token) {
    return {
      leads: [],
      error: "NOTION_ACCESS_TOKEN fehlt in der Server-Umgebung.",
      fetchedAt,
    };
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_META_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: Math.min(Math.max(limit, 1), 100),
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        }),
        // Demo: immer frisch; später Cache/Sync-Tabelle
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return {
        leads: [],
        error: `Notion API ${res.status}: ${body.slice(0, 280)}`,
        fetchedAt,
      };
    }

    const json = (await res.json()) as {
      results?: {
        id: string;
        url?: string;
        properties?: Record<string, NotionProp>;
      }[];
    };

    return {
      leads: (json.results ?? []).map(mapPage),
      error: null,
      fetchedAt,
    };
  } catch (e) {
    return {
      leads: [],
      error: e instanceof Error ? e.message : "Unbekannter Notion-Fehler",
      fetchedAt,
    };
  }
}
