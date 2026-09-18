"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { NotionLeadDetailModal } from "@/components/setter/NotionLeadDetailModal";
import {
  notionLeadDetailPath,
  type NotionMetaLead,
} from "@/lib/notion/metaLeads";

function fmtWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtDay(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

const COLUMN_ORDER_SET = [
  "Neuer Kontakt",
  "1st Reminder",
  "2nd Reminder",
  "Setting terminiert",
  "Terminiert EG",
  "Warteliste Set",
  "Lost",
];

const COLUMN_ORDER_EG = [
  "Terminiert",
  "RP ?",
  "Commited!",
  "Lost",
  "Nicht erschienen",
];

type GroupBy = "statusSet" | "statusEg" | "status";
type Scope = "all" | "mineSetter" | "mineEg";
type RpFilter = "all" | "yes" | "no";

function columnKey(lead: NotionMetaLead, groupBy: GroupBy): string {
  const raw =
    groupBy === "statusEg"
      ? lead.statusEg
      : groupBy === "status"
        ? lead.status
        : lead.statusSet;
  return (raw ?? "").trim() || "Ohne Status";
}

function orderedColumns(keys: string[], preferred: string[]): string[] {
  const set = new Set(keys);
  const out: string[] = [];
  for (const p of preferred) {
    if (set.has(p)) {
      out.push(p);
      set.delete(p);
    }
  }
  const rest = [...set].sort((a, b) => a.localeCompare(b, "de"));
  const without = rest.filter((k) => k !== "Ohne Status");
  if (rest.includes("Ohne Status")) without.push("Ohne Status");
  return [...out, ...without];
}

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesPerson(field: string | null, aliases: string[]): boolean {
  if (!field || !aliases.length) return false;
  const hay = norm(field);
  return aliases.some((a) => {
    const n = norm(a);
    return n.length >= 2 && (hay.includes(n) || n.includes(hay.split(",")[0] ?? ""));
  });
}

function isLost(lead: NotionMetaLead): boolean {
  return [lead.statusSet, lead.statusEg, lead.status].some((s) =>
    /lost/i.test(s ?? "")
  );
}

type Props = {
  leads: NotionMetaLead[];
  error: string | null;
  fetchedAt: string;
  /** Name aliases of the logged-in user for "Meine" filters */
  viewerAliases: string[];
  defaultGroupBy?: GroupBy;
  defaultScope?: Scope;
  emptyHint?: string;
};

export function NotionLeadboardBoard({
  leads,
  error,
  fetchedAt,
  viewerAliases,
  defaultGroupBy = "statusSet",
  defaultScope = "all",
  emptyHint = "Keine Einträge geladen.",
}: Props) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [groupBy, setGroupBy] = useState<GroupBy>(defaultGroupBy);
  const [hideLost, setHideLost] = useState(true);
  const [rpFilter, setRpFilter] = useState<RpFilter>("all");
  const [setterFilter, setSetterFilter] = useState("all");
  const [egFilter, setEgFilter] = useState("all");
  const [openLead, setOpenLead] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const setters = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) if (l.setter) s.add(l.setter);
    return [...s].sort((a, b) => a.localeCompare(b, "de"));
  }, [leads]);

  const egs = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) if (l.eg) s.add(l.eg);
    return [...s].sort((a, b) => a.localeCompare(b, "de"));
  }, [leads]);

  const filtered = useMemo(() => {
    const query = norm(q);
    return leads.filter((lead) => {
      if (hideLost && isLost(lead)) return false;
      if (scope === "mineSetter" && !matchesPerson(lead.setter, viewerAliases)) {
        return false;
      }
      if (scope === "mineEg" && !matchesPerson(lead.eg, viewerAliases)) {
        return false;
      }
      if (setterFilter !== "all" && lead.setter !== setterFilter) return false;
      if (egFilter !== "all" && lead.eg !== egFilter) return false;
      if (rpFilter === "yes") {
        const ok = lead.rp === true || /yes|ja|bezahlt/i.test(lead.rpSelect ?? "");
        if (!ok) return false;
      }
      if (rpFilter === "no") {
        const paid = lead.rp === true || /yes|ja|bezahlt/i.test(lead.rpSelect ?? "");
        if (paid) return false;
      }
      if (!query) return true;
      const blob = norm(
        [
          lead.name,
          lead.status,
          lead.statusSet,
          lead.statusEg,
          lead.setter,
          lead.eg,
          lead.therapist,
          lead.rpSelect,
        ].join(" ")
      );
      return blob.includes(query);
    });
  }, [
    leads,
    q,
    scope,
    hideLost,
    rpFilter,
    setterFilter,
    egFilter,
    viewerAliases,
  ]);

  const preferred =
    groupBy === "statusEg"
      ? COLUMN_ORDER_EG
      : groupBy === "statusSet"
        ? COLUMN_ORDER_SET
        : [];

  const buckets = useMemo(() => {
    const map = new Map<string, NotionMetaLead[]>();
    for (const lead of filtered) {
      const key = columnKey(lead, groupBy);
      const list = map.get(key) ?? [];
      list.push(lead);
      map.set(key, list);
    }
    return map;
  }, [filtered, groupBy]);

  const columns = orderedColumns([...buckets.keys()], preferred);

  const stats = useMemo(() => {
    const mineSet = leads.filter((l) => matchesPerson(l.setter, viewerAliases)).length;
    const mineEg = leads.filter((l) => matchesPerson(l.eg, viewerAliases)).length;
    const rpYes = filtered.filter(
      (l) => l.rp === true || /yes|ja|bezahlt/i.test(l.rpSelect ?? "")
    ).length;
    return {
      total: leads.length,
      visible: filtered.length,
      mineSet,
      mineEg,
      rpYes,
      columns: columns.length,
    };
  }, [leads, filtered, viewerAliases, columns.length]);

  const chip = (active: boolean) =>
    [
      "rounded-full px-3 py-1.5 text-xs font-medium transition",
      active
        ? "bg-[#63eca9]/22 text-[#63eca9] shadow-[0_0_12px_rgba(99,236,169,0.2)]"
        : "text-white/55 hover:bg-white/[0.06] hover:text-white/85",
    ].join(" ");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Geladen", value: String(stats.total) },
          { label: "Sichtbar", value: String(stats.visible) },
          { label: "Meine Setter", value: String(stats.mineSet) },
          { label: "Meine EG", value: String(stats.mineEg) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-wide text-white/45">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche Name, Setter, EG, Status …"
              className="w-full rounded-full border border-white/12 bg-black/35 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#63eca9]/4"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/12 bg-black/25 p-0.5">
            {(
              [
                ["all", "Alle"],
                ["mineSetter", "Meine Setter"],
                ["mineEg", "Meine EG"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={chip(scope === id)}
                onClick={() => setScope(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/12 bg-black/25 p-0.5">
            {(
              [
                ["statusSet", "Status SET"],
                ["statusEg", "Status EG"],
                ["status", "Status"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={chip(groupBy === id)}
                onClick={() => setGroupBy(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={setterFilter}
            onChange={(e) => setSetterFilter(e.target.value)}
            className="rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-xs text-white/80"
          >
            <option value="all">Setter: alle</option>
            {setters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={egFilter}
            onChange={(e) => setEgFilter(e.target.value)}
            className="rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-xs text-white/80"
          >
            <option value="all">EG: alle</option>
            {egs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/12 bg-black/25 p-0.5">
            {(
              [
                ["all", "RP alle"],
                ["yes", "RP ja"],
                ["no", "RP offen"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={chip(rpFilter === id)}
                onClick={() => setRpFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={chip(hideLost)}
            onClick={() => setHideLost((v) => !v)}
          >
            {hideLost ? "Lost ausgeblendet" : "Lost sichtbar"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/40">
          <span>
            Stand Abruf: {fmtWhen(fetchedAt)} · {stats.visible} von {stats.total}{" "}
            geladen · {stats.columns} Spalten · RP sichtbar: {stats.rpYes}
          </span>
          <span>Nur Lesen · Pipeline Pro / Meta · Klick öffnet Popup</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {!error && filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-white/50">
          {leads.length === 0 ? emptyHint : "Keine Treffer für diese Filter."}
        </div>
      ) : null}

      <div className="loh-scroll flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const items = buckets.get(col) ?? [];
          return (
            <section
              key={col}
              className="w-[280px] shrink-0 rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_0_40px_rgba(99,236,169,0.05)]"
            >
              <header className="sticky top-0 z-[1] flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-md">
                <h2 className="truncate text-sm font-medium text-white">{col}</h2>
                <span className="rounded-full bg-[#63eca9]/15 px-2 py-0.5 text-[11px] text-[#63eca9]">
                  {items.length}
                </span>
              </header>
              <ul className="loh-scroll max-h-[58vh] space-y-2 overflow-y-auto p-2">
                {items.map((lead) => {
                  const href = notionLeadDetailPath(lead.id);
                  return (
                    <li key={lead.id}>
                      <article className="group relative rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-[#63eca9]/4 hover:bg-black/55">
                        <button
                          type="button"
                          className="absolute inset-0 z-0 rounded-xl"
                          aria-label={`${lead.name} öffnen`}
                          onClick={() =>
                            setOpenLead({ id: lead.id, name: lead.name })
                          }
                        />
                        <Link
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          title="Als Seite in neuem Tab"
                          aria-label={`${lead.name} in neuem Tab öffnen`}
                          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/55 opacity-0 shadow-lg transition hover:border-[#63eca9]/5 hover:text-[#63eca9] group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                          >
                            <path
                              d="M7 17L17 7M10 7h7v7"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                        <div className="relative z-10 pointer-events-none">
                          <div className="flex items-start justify-between gap-2 pr-8">
                            <p className="min-w-0 flex-1 text-sm font-medium text-[#63eca9]">
                              {lead.name}
                            </p>
                            {lead.rp === true ||
                            /yes|ja|bezahlt/i.test(lead.rpSelect ?? "") ? (
                              <span className="shrink-0 rounded-md bg-[#63eca9]/18 px-1.5 py-0.5 text-[10px] font-semibold text-[#63eca9]">
                                RP
                              </span>
                            ) : null}
                          </div>
                          <dl className="mt-2 space-y-1 text-[11px] text-white/50">
                            {groupBy !== "status" && lead.status ? (
                              <div className="flex justify-between gap-2">
                                <dt>Status</dt>
                                <dd className="text-right text-white/75">
                                  {lead.status}
                                </dd>
                              </div>
                            ) : null}
                            {groupBy !== "statusSet" && lead.statusSet ? (
                              <div className="flex justify-between gap-2">
                                <dt>SET</dt>
                                <dd className="text-right text-white/75">
                                  {lead.statusSet}
                                </dd>
                              </div>
                            ) : null}
                            {groupBy !== "statusEg" && lead.statusEg ? (
                              <div className="flex justify-between gap-2">
                                <dt>EG-Status</dt>
                                <dd className="text-right text-white/75">
                                  {lead.statusEg}
                                </dd>
                              </div>
                            ) : null}
                            {lead.setter ? (
                              <div className="flex justify-between gap-2">
                                <dt>Setter</dt>
                                <dd className="text-right text-white/75">
                                  {lead.setter}
                                </dd>
                              </div>
                            ) : null}
                            {lead.eg ? (
                              <div className="flex justify-between gap-2">
                                <dt>EG</dt>
                                <dd className="text-right text-white/75">{lead.eg}</dd>
                              </div>
                            ) : null}
                            {lead.therapist ? (
                              <div className="flex justify-between gap-2">
                                <dt>Therapeut</dt>
                                <dd className="text-right text-white/75">
                                  {lead.therapist}
                                </dd>
                              </div>
                            ) : null}
                            {lead.terminatedAt ? (
                              <div className="flex justify-between gap-2">
                                <dt>Termin</dt>
                                <dd className="text-right text-white/75">
                                  {fmtDay(lead.terminatedAt)}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <NotionLeadDetailModal
        leadId={openLead?.id ?? null}
        leadName={openLead?.name ?? null}
        onClose={() => setOpenLead(null)}
      />
    </div>
  );
}
