"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatGermanDateTime, formatGermanUnlockAt } from "@/lib/clientId";
import { isoToBerlinDatetimeLocal } from "@/lib/berlinDatetime";
import { getAdminVideoStatusBadge } from "@/lib/adminVideoStatus";
import type { VideoAccessState } from "@/lib/videoUnlock";
import {
  reseedUserVideoUnlocks,
  updateUserVideoUnlock,
} from "@/app/admin/users/[slug]/videos/actions";
import { UnlockDatetimeField } from "@/components/admin/UnlockDatetimeField";

export type AdminUserVideoRow = {
  videoId: string;
  globalPosition: number;
  title: string;
  chapterTitle: string;
  watchPercent: number;
  completedAt: string | null;
  unlockAt: string | null;
  unlockSource: string | null;
  accessState: VideoAccessState;
};

type AdminUserVideosTableProps = {
  clientId: string;
  rows: AdminUserVideoRow[];
};

function StatusBadge({ state }: { state: VideoAccessState }) {
  const badge = getAdminVideoStatusBadge(state);
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function VideoRowEditor({
  clientId,
  row,
}: {
  clientId: string;
  row: AdminUserVideoRow;
}) {
  const router = useRouter();
  const [localValue, setLocalValue] = useState(
    row.unlockAt ? isoToBerlinDatetimeLocal(row.unlockAt) : ""
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scheduleHint =
    row.accessState.status === "locked_schedule"
      ? row.accessState.message
      : row.unlockAt
        ? formatGermanUnlockAt(row.unlockAt)
        : null;

  return (
    <tr className="border-t border-white/10 align-top">
      <td className="px-3 py-3 font-mono text-xs text-white/50">{row.globalPosition}</td>
      <td className="px-3 py-3">
        <div className="font-medium text-white">{row.title}</div>
        <div className="text-xs text-white/50">{row.chapterTitle}</div>
      </td>
      <td className="px-3 py-3">
        {row.completedAt ? (
          <span className="text-[#63eca9]">100%</span>
        ) : (
          <span className="text-white/80">{Math.round(row.watchPercent)}%</span>
        )}
        {row.completedAt && (
          <div className="mt-0.5 text-xs text-white/50">
            {formatGermanDateTime(row.completedAt)}
          </div>
        )}
      </td>
      <td className="px-3 py-3">
        <StatusBadge state={row.accessState} />
        {scheduleHint && row.accessState.status !== "available" && (
          <div className="mt-1 max-w-[220px] text-xs text-white/50">{scheduleHint}</div>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <UnlockDatetimeField
            value={localValue}
            onChange={setLocalValue}
            ariaLabel={`Freischaltung ${row.title}`}
          />
          <button
            type="button"
            disabled={isPending || !localValue}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                try {
                  await updateUserVideoUnlock(clientId, row.videoId, localValue);
                  setMessage("Gespeichert");
                  router.refresh();
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Fehler beim Speichern");
                }
              });
            }}
            className="shrink-0 rounded-lg border border-[#63eca9]/40 px-3 py-2 text-sm text-[#63eca9] transition-colors hover:bg-[#63eca9]/10 disabled:opacity-40"
          >
            {isPending ? "…" : "Speichern"}
          </button>
        </div>
        {row.unlockSource && (
          <p className="mt-1 text-xs text-white/40">
            Quelle: {row.unlockSource === "default" ? "Standard" : row.unlockSource === "manual" ? "Manuell" : row.unlockSource}
          </p>
        )}
        {!row.unlockAt && row.globalPosition < 4 && (
          <p className="mt-1 text-xs text-white/40">Optional: Zeitplan für sequentielle Videos</p>
        )}
        {message && (
          <p
            className={`mt-1 text-xs ${message === "Gespeichert" ? "text-[#63eca9]" : "text-red-300"}`}
          >
            {message}
          </p>
        )}
      </td>
    </tr>
  );
}

export function AdminUserVideosTable({ clientId, rows }: AdminUserVideosTableProps) {
  const router = useRouter();
  const [reseedMsg, setReseedMsg] = useState<string | null>(null);
  const [isReseeding, startReseed] = useTransition();

  const completedCount = useMemo(
    () => rows.filter((r) => r.accessState.status === "completed").length,
    [rows]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/60">
          {completedCount} von {rows.length} Videos abgeschlossen
        </p>
        <button
          type="button"
          disabled={isReseeding}
          onClick={() => {
            setReseedMsg(null);
            startReseed(async () => {
              try {
                const result = await reseedUserVideoUnlocks(clientId);
                setReseedMsg(
                  `Standard-Zeitplan angewendet (${result.count ?? 0} Einträge).`
                );
                router.refresh();
              } catch (err) {
                setReseedMsg(
                  err instanceof Error ? err.message : "Fehler beim Anwenden"
                );
              }
            });
          }}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 disabled:opacity-40"
        >
          {isReseeding ? "Wird angewendet…" : "Standard-Zeitplan neu anwenden"}
        </button>
      </div>
      {reseedMsg && (
        <p className={`text-sm ${reseedMsg.includes("Fehler") ? "text-red-300" : "text-[#63eca9]"}`}>
          {reseedMsg}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/5 text-left text-white/70">
            <tr>
              <th className="px-3 py-2 w-12">#</th>
              <th className="px-3 py-2">Video</th>
              <th className="px-3 py-2">Fortschritt</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Freischaltung (Europe/Berlin)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <VideoRowEditor key={row.videoId} clientId={clientId} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
