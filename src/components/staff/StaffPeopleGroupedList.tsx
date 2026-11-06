"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TherapistGroup } from "@/lib/staffClientsData";
import { PIPELINE_STATUS_LABEL } from "@/lib/pipelineStatus";

type ViewMode = "cards" | "list";

type StaffPeopleGroupedListProps = {
  groups: TherapistGroup[];
  emptyHint: string;
  showPipelineStatus?: boolean;
};

function PersonCard({
  href,
  name,
  meta,
  badge,
}: {
  href: string;
  name: string;
  meta: string;
  badge?: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 transition hover:border-[#63eca9]/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#63eca9]/20 text-sm font-semibold text-[#63eca9]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{name}</div>
          <div className="mt-0.5 truncate text-xs text-white/40">{meta}</div>
          {badge ? (
            <span className="mt-2 inline-block rounded-full border border-white/12 px-2 py-0.5 text-[10px] text-white/50">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 text-xs text-[#63eca9]/75">Akte →</div>
    </Link>
  );
}

export function StaffPeopleGroupedList({
  groups,
  emptyHint,
  showPipelineStatus = false,
}: StaffPeopleGroupedListProps) {
  const [view, setView] = useState<ViewMode>("cards");
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());

  const total = useMemo(
    () => groups.reduce((sum, g) => sum + g.rows.length, 0),
    [groups]
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-white/45">
        {emptyHint}
      </div>
    );
  }

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/40">{total} Einträge</p>
        <div
          className="flex rounded-full border border-white/15 bg-black/30 p-0.5 text-xs"
          role="group"
          aria-label="Ansicht wechseln"
        >
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              view === "cards"
                ? "bg-[#63eca9]/25 text-[#63eca9]"
                : "text-white/55 hover:text-white/85"
            }`}
          >
            Karten
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              view === "list"
                ? "bg-[#63eca9]/25 text-[#63eca9]"
                : "text-white/55 hover:text-white/85"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.therapistKey} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-white">{group.therapistLabel}</h2>
                <span className="text-xs text-white/40">{group.rows.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.rows.map((row) => (
                  <PersonCard
                    key={row.user_id}
                    href={row.detail_href}
                    name={row.name}
                    meta={`${row.client_id ?? ""}${row.email ? ` · ${row.email}` : ""}`}
                    badge={
                      showPipelineStatus
                        ? PIPELINE_STATUS_LABEL[row.pipeline_status]
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <ul className="divide-y divide-white/[0.06]">
            {groups.map((group) => {
              const open = openKeys.has(group.therapistKey);
              return (
                <li key={group.therapistKey}>
                  <button
                    type="button"
                    onClick={() => toggle(group.therapistKey)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
                    aria-expanded={open}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`shrink-0 text-white/50 transition ${open ? "rotate-90" : ""}`}
                      aria-hidden
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                      {group.therapistLabel}
                    </span>
                    <span className="rounded-full border border-white/12 px-2.5 py-0.5 text-xs text-white/50">
                      {group.rows.length} Klienten
                    </span>
                  </button>
                  {open ? (
                    <ul className="border-t border-white/[0.05] bg-black/20">
                      {group.rows.map((row) => (
                        <li key={row.user_id}>
                          <Link
                            href={row.detail_href}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 pl-11 transition hover:bg-[#63eca9]/08"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm text-white">{row.name}</div>
                              <div className="truncate text-xs text-white/40">
                                {row.client_id}
                                {row.email ? ` · ${row.email}` : ""}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-[#63eca9]/80">Akte →</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
