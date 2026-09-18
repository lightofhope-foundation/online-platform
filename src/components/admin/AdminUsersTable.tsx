"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { bulkUpdateUserAccessLevel } from "@/app/admin/users/actions";
import type { AccessLevelOption } from "@/lib/accessLevels";
import { formatAccessLevelLabel } from "@/lib/accessLevels";
import { formatProfileRole } from "@/lib/profileRole";

export type AdminUserRow = {
  user_id: string;
  client_id: string | null;
  email: string;
  name: string;
  role: string;
  access_level: number;
  video_progress: number | null;
  therapist_label: string | null;
  therapist_href: string | null;
  created_at: string;
  last_login: string;
  detail_href: string | null;
};

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  accessLevels: AccessLevelOption[];
};

type RoleFilter = "all" | "client" | "staff" | string;
type SortKey =
  | "client_id"
  | "email"
  | "name"
  | "role"
  | "therapist_label"
  | "access_level"
  | "video_progress"
  | "created_at"
  | "last_login";
type SortDir = "asc" | "desc";

const thClass =
  "whitespace-nowrap border-b border-r border-white/10 px-3 py-2.5 font-medium text-white/70 last:border-r-0";
const tdClass =
  "whitespace-nowrap border-b border-r border-white/[0.08] px-3 py-2.5 last:border-r-0 align-middle";

function cmpStr(a: string, b: string) {
  return a.localeCompare(b, "de", { sensitivity: "base", numeric: true });
}

export function AdminUsersTable({ rows, accessLevels }: AdminUsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLevel, setBulkLevel] = useState(
    String(accessLevels[0]?.access_level ?? 0)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const roleOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.role));
    return [...set].sort((a, b) =>
      formatProfileRole(a).localeCompare(formatProfileRole(b), "de")
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;

    if (roleFilter === "client") {
      list = list.filter((r) => r.role === "client");
    } else if (roleFilter === "staff") {
      list = list.filter((r) => r.role !== "client");
    } else if (roleFilter !== "all") {
      list = list.filter((r) => r.role === roleFilter);
    }

    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.client_id,
          r.email,
          r.name,
          r.role,
          formatProfileRole(r.role),
          r.therapist_label,
          formatAccessLevelLabel(r.access_level, accessLevels),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let res = 0;
      switch (sortKey) {
        case "client_id":
          res = cmpStr(a.client_id ?? "", b.client_id ?? "");
          break;
        case "email":
          res = cmpStr(a.email, b.email);
          break;
        case "name":
          res = cmpStr(a.name, b.name);
          break;
        case "role":
          res = cmpStr(formatProfileRole(a.role), formatProfileRole(b.role));
          break;
        case "therapist_label":
          res = cmpStr(a.therapist_label ?? "", b.therapist_label ?? "");
          break;
        case "access_level":
          res = a.access_level - b.access_level;
          break;
        case "video_progress":
          res = (a.video_progress ?? -1) - (b.video_progress ?? -1);
          break;
        case "created_at":
          res = cmpStr(a.created_at, b.created_at);
          break;
        case "last_login":
          res = cmpStr(a.last_login, b.last_login);
          break;
      }
      if (res === 0) res = cmpStr(a.email, b.email);
      return res * dir;
    });
  }, [rows, search, roleFilter, sortKey, sortDir, accessLevels]);

  const clientRows = filtered.filter((r) => r.role === "client");
  const allClientsSelected =
    clientRows.length > 0 && clientRows.every((r) => selected.has(r.user_id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" || key === "last_login" ? "desc" : "asc");
    }
  };

  const SortTh = ({
    label,
    column,
    className = thClass,
  }: {
    label: string;
    column: SortKey;
    className?: string;
  }) => {
    const active = sortKey === column;
    return (
      <th className={className}>
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={[
            "inline-flex items-center gap-1 transition-colors",
            active ? "text-[#63eca9]" : "hover:text-white",
          ].join(" ")}
          title={`${label} sortieren`}
        >
          {label}
          <span className="text-[10px] opacity-80" aria-hidden>
            {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  const toggleBulkMode = () => {
    setBulkMode((v) => !v);
    setSelected(new Set());
    setMessage(null);
  };

  const toggleRow = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllClients = () => {
    if (allClientsSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clientRows.map((r) => r.user_id)));
    }
  };

  const applyBulk = () => {
    const level = Number(bulkLevel);
    if (Number.isNaN(level)) return;
    startTransition(async () => {
      setMessage(null);
      const result = await bulkUpdateUserAccessLevel([...selected], level);
      if (result.ok) {
        setMessage(
          `${result.updated} Klient(en) auf ${formatAccessLevelLabel(level, accessLevels)} gesetzt.`
        );
        setSelected(new Set());
        setBulkMode(false);
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen (Nutzer-ID, E-Mail, Name, Therapeut, Stufe …)"
            className="w-full max-w-md rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#63eca9]/50 focus:outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white"
            aria-label="Rollenfilter"
          >
            <option value="all">Alle Nutzer</option>
            <option value="client">Nur Klienten</option>
            <option value="staff">Nur Team (ohne Klienten)</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                Rolle: {formatProfileRole(role)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40">
            {filtered.length} von {rows.length}
          </span>
          <button
            type="button"
            onClick={toggleBulkMode}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              bulkMode
                ? "border-[#63eca9]/60 bg-[#63eca9]/15 text-[#63eca9]"
                : "border-white/15 bg-white/[0.04] text-white hover:border-white/25"
            }`}
          >
            {bulkMode ? "Mehrfache Bearbeitung beenden" : "Mehrfache Bearbeitung"}
          </button>
        </div>
      </div>

      {bulkMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <button
            type="button"
            onClick={toggleSelectAllClients}
            className="text-sm text-[#63eca9] hover:underline"
          >
            {allClientsSelected ? "Auswahl aufheben" : "Alle Klienten wählen"}
          </button>
          <span className="text-sm text-white/50">{selected.size} ausgewählt</span>
          <label className="flex items-center gap-2 text-sm text-white/70">
            Stufe
            <select
              value={bulkLevel}
              onChange={(e) => setBulkLevel(e.target.value)}
              className="rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-white"
            >
              {accessLevels.map((l) => (
                <option key={l.access_level} value={l.access_level}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={applyBulk}
            className="rounded-full bg-[#63eca9] px-4 py-1.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {pending ? "Speichern …" : "Stufe zuweisen"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.includes("fehlgeschlagen") ||
            message.includes("Ungültig") ||
            message.includes("Keine")
              ? "text-red-400"
              : "text-[#63eca9]"
          }`}
        >
          {message}
        </p>
      )}

      <div className="admin-table-scroll overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
        <table
          className={`w-full border-collapse text-sm ${
            bulkMode ? "min-w-[1280px]" : "min-w-[1200px]"
          }`}
        >
          <thead className="bg-white/[0.04] text-left">
            <tr>
              {bulkMode && <th className={`${thClass} w-10`} aria-label="Auswahl" />}
              <SortTh label="Nutzer-ID" column="client_id" />
              <SortTh label="E-Mail" column="email" />
              <SortTh label="Name" column="name" />
              <SortTh label="Rolle" column="role" />
              <SortTh label="Therapeut" column="therapist_label" />
              <SortTh label="Stufe" column="access_level" />
              <SortTh label="Video-Fortschritt" column="video_progress" />
              <SortTh label="Erstellt" column="created_at" />
              <SortTh label="Letzter Login" column="last_login" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id} className="h-11 hover:bg-white/[0.03]">
                {bulkMode && (
                  <td className={tdClass}>
                    {r.role === "client" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(r.user_id)}
                        onChange={() => toggleRow(r.user_id)}
                        className="h-4 w-4 rounded border-white/30 accent-[#63eca9]"
                        aria-label={`${r.name} auswählen`}
                      />
                    ) : null}
                  </td>
                )}
                <td className={`${tdClass} font-mono text-xs`}>
                  <CellLink href={r.detail_href}>{r.client_id ?? "—"}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.email}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.name}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{formatProfileRole(r.role)}</CellLink>
                </td>
                <td className={tdClass}>
                  {r.therapist_href && r.therapist_label ? (
                    <Link
                      href={r.therapist_href}
                      className="inline-block whitespace-nowrap transition-colors hover:text-[#63eca9]"
                    >
                      {r.therapist_label}
                    </Link>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>
                    {r.role === "client"
                      ? formatAccessLevelLabel(r.access_level, accessLevels)
                      : "—"}
                  </CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>
                    {r.video_progress != null ? `${r.video_progress}%` : "—"}
                  </CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.created_at}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.last_login}</CellLink>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={bulkMode ? 10 : 9}
                  className="border-b border-white/10 px-3 py-8 text-center text-white/50"
                >
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) {
    return <span className="inline-block whitespace-nowrap text-white/80">{children}</span>;
  }
  return (
    <Link
      href={href}
      className="inline-block whitespace-nowrap transition-colors hover:text-[#63eca9]"
    >
      {children}
    </Link>
  );
}
