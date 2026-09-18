import Link from "next/link";

import type { NotionMetaLeadDetail } from "@/lib/notion/metaLeads";

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const HIGHLIGHT_KEYS = [
  "Status",
  "Status SET",
  "Status EG",
  "Setter",
  "EG",
  "Therapeut",
  "Terminiert",
  "RP",
  "RP.",
];

type Props = {
  lead: NotionMetaLeadDetail;
  fetchedAt: string;
  mode?: "page" | "panel";
  backHref?: string;
  backLabel?: string;
  titleAs?: "h1" | "h2";
};

export function NotionLeadDetailView({
  lead,
  fetchedAt,
  mode = "page",
  backHref = "/setter/leadboard",
  backLabel = "Notion Leadboard",
  titleAs = mode === "panel" ? "h2" : "h1",
}: Props) {
  const highlight = new Set(HIGHLIGHT_KEYS);
  const primary = lead.fields.filter((f) => highlight.has(f.key));
  const rest = lead.fields.filter((f) => !highlight.has(f.key));
  const TitleTag = titleAs;

  return (
    <div className="space-y-6">
      {mode === "page" ? (
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-white/55">
          <Link href={backHref} className="text-[#63eca9] hover:underline">
            {backLabel}
          </Link>
          <span className="text-white/30">/</span>
          <span className="truncate text-white/80">{lead.name}</span>
        </nav>
      ) : null}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-white/40">
            Notion-Kundenkarte · nur Lesen
          </p>
          <TitleTag
            className={
              mode === "panel"
                ? "mt-1 text-xl font-semibold text-white sm:text-2xl"
                : "mt-1 typo-page-title font-semibold text-white"
            }
          >
            {lead.name}
          </TitleTag>
          <p className="mt-2 text-sm text-white/50">
            Live aus Pipeline Pro / Meta · Stand Abruf {fmtWhen(fetchedAt)}
            {lead.archived ? " · archiviert" : ""}
          </p>
        </div>
        {mode === "page" ? (
          <Link
            href={backHref}
            className="shrink-0 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-[#63eca9]/35 hover:text-[#63eca9]"
          >
            ← Zurück
          </Link>
        ) : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Status SET", value: lead.statusSet },
          { label: "Status EG", value: lead.statusEg },
          { label: "Status", value: lead.status },
          { label: "Setter", value: lead.setter },
          { label: "EG", value: lead.eg },
          { label: "Therapeut", value: lead.therapist },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-wide text-white/45">
              {item.label}
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {item.value?.trim() || "—"}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-lg font-medium text-white">Kernfelder</h2>
        <p className="mt-1 text-sm text-white/45">
          Die wichtigsten Pipeline-Felder — Schreibzugriff folgt später (nach Freigabe).
        </p>
        <dl className="mt-4 divide-y divide-white/8">
          {primary.length === 0 ? (
            <p className="py-3 text-sm text-white/45">Keine Kernfelder belegt.</p>
          ) : (
            primary.map((f) => (
              <div
                key={f.key}
                className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,32%)_1fr] sm:gap-4"
              >
                <dt className="text-sm text-white/45">{f.key}</dt>
                <dd className="break-words text-sm text-white/90 sm:text-left">
                  {f.value}
                </dd>
              </div>
            ))
          )}
        </dl>
      </section>

      <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-lg font-medium text-white">Alle Notion-Properties</h2>
        <p className="mt-1 text-sm text-white/45">
          Vollständiger Live-Abruf der Page — leer gelassene Felder sind ausgeblendet.
        </p>
        <dl className="mt-4 divide-y divide-white/8">
          {rest.length === 0 && primary.length === 0 ? (
            <p className="py-3 text-sm text-white/45">Keine Properties gefunden.</p>
          ) : rest.length === 0 ? (
            <p className="py-3 text-sm text-white/45">
              Keine weiteren Felder neben den Kernfeldern.
            </p>
          ) : (
            rest.map((f) => (
              <div
                key={f.key}
                className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,32%)_1fr] sm:gap-4"
              >
                <dt className="text-sm text-white/45">{f.key}</dt>
                <dd className="break-words text-sm leading-relaxed text-white/90 sm:text-left">
                  {looksLikeUrl(f.value) ? (
                    <a
                      href={f.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#63eca9] hover:underline"
                    >
                      {f.value}
                    </a>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))
          )}
        </dl>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/40">
        <span>
          Erstellt: {fmtWhen(lead.createdTime)} · Zuletzt in Notion:{" "}
          {fmtWhen(lead.lastEdited)}
        </span>
        <span>Quelle: Pipeline Pro / Meta · bidirektional später</span>
      </footer>
    </div>
  );
}

function looksLikeUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}
