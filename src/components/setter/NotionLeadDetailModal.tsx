"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { NotionLeadDetailView } from "@/components/setter/NotionLeadDetailView";
import {
  notionLeadDetailPath,
  type NotionMetaLeadDetail,
} from "@/lib/notion/metaLeads";

type Props = {
  leadId: string | null;
  leadName?: string | null;
  onClose: () => void;
};

export function NotionLeadDetailModal({ leadId, leadName, onClose }: Props) {
  const [lead, setLead] = useState<NotionMetaLeadDetail | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [leadId, onClose]);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setFetchedAt(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLead(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/setter/notion-lead/${encodeURIComponent(leadId)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as {
          lead?: NotionMetaLeadDetail;
          fetchedAt?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? `Fehler ${res.status}`);
          return;
        }
        setLead(json.lead ?? null);
        setFetchedAt(json.fetchedAt ?? new Date().toISOString());
        if (!json.lead) setError("Lead nicht gefunden.");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (!leadId || typeof document === "undefined") return null;

  const title = lead?.name ?? leadName ?? "Kundenkarte";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] overflow-y-auto loh-scroll"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Schließen"
      />
      <div className="relative flex min-h-full items-start justify-center px-3 py-8 sm:items-center sm:px-6">
        <div
          className="relative z-10 flex max-h-[min(92vh,920px)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[#0c1412] shadow-[0_0_60px_rgba(99,236,169,0.12)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="truncate text-sm text-white/55">
              Kundenkarte · Pipeline Pro / Meta
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={notionLeadDetailPath(leadId)}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white/70 transition hover:border-[#63eca9]/4 hover:text-[#63eca9]"
                title="Als Seite in neuem Tab"
              >
                ↗ Seite
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
              >
                Schließen
              </button>
            </div>
          </div>

          <div className="loh-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {loading ? (
              <p className="py-16 text-center text-sm text-white/50">
                Lade Notion-Daten …
              </p>
            ) : null}
            {error && !loading ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
                {error}
              </div>
            ) : null}
            {lead && fetchedAt && !loading ? (
              <NotionLeadDetailView
                lead={lead}
                fetchedAt={fetchedAt}
                mode="panel"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
