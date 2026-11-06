"use client";

import { useRef, useState } from "react";
import {
  therapistClearSessionRecording,
  therapistLinkSessionRecording,
  therapistSaveSessionRecording,
} from "@/app/actions/therapySessions";
import { VideoThumbnailPreview } from "@/components/dashboard/VideoThumbnailPreview";
import { uploadBunnyStorageFileDirect } from "@/lib/bunnyStorageUploadClient";
import { isStorageRecordingRef } from "@/lib/sessionRecordingStorage";

type SessionRecordingPanelProps = {
  clientId: string;
  sessionId: string;
  sessionNumber: number;
  recordingTitle: string | null;
  bunnyVideoId: string | null;
  onUpdated: () => void;
};

export function SessionRecordingPanel({
  clientId,
  sessionId,
  sessionNumber,
  recordingTitle,
  bunnyVideoId,
  onUpdated,
}: SessionRecordingPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(
    recordingTitle ?? `Sitzung ${sessionNumber} — Aufnahme`
  );
  const [linkInput, setLinkInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const hasRecording = Boolean(bunnyVideoId?.trim());

  const handleUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    setUploadPct(0);
    try {
      const prepRes = await fetch("/api/therapist/session-recording/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          sessionId,
          title,
          fileName: file.name,
        }),
      });
      const prepJson = (await prepRes.json()) as {
        error?: string;
        putUrl?: string;
        accessKey?: string;
        publicUrl?: string;
      };
      if (!prepRes.ok || !prepJson.putUrl || !prepJson.accessKey || !prepJson.publicUrl) {
        throw new Error(prepJson.error || `Prepare fehlgeschlagen (${prepRes.status})`);
      }

      await uploadBunnyStorageFileDirect(
        prepJson.putUrl,
        prepJson.accessKey,
        file,
        (p) => setUploadPct(p)
      );

      await therapistSaveSessionRecording(
        clientId,
        sessionId,
        prepJson.publicUrl,
        title
      );
      setUploadPct(null);
      onUpdated();
    } catch (e) {
      setUploadPct(null);
      const msg = e instanceof Error ? e.message : "Upload fehlgeschlagen";
      // Next Server Action digests → klarere Meldung
      setError(
        msg.includes("Server Components render") || msg.includes("digest")
          ? "Upload fehlgeschlagen (Serverfehler). Bitte Bunny-Storage-Env in Vercel prüfen oder erneut versuchen."
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLink = async () => {
    setBusy(true);
    setError(null);
    try {
      await therapistLinkSessionRecording(clientId, sessionId, linkInput, title);
      setLinkInput("");
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verknüpfung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Sitzungsaufnahme wirklich entfernen?")) return;
    setBusy(true);
    setError(null);
    try {
      await therapistClearSessionRecording(clientId, sessionId);
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const progressLabel =
    uploadPct !== null
      ? `Wird hochgeladen ${uploadPct.toFixed(1)}%`
      : "Video hochladen";

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-white/50">
        Sitzungsaufnahme
      </h3>
      <p className="mt-1 text-xs text-white/40">
        Upload geht direkt zu Bunny Storage (beliebige Dateigröße) unter
        Online-Plattform/sitzungsaufnahmen/therapeut/… und erscheint für den
        Klienten, sobald die Sitzung freigegeben ist.
      </p>

      {hasRecording && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-[#63eca9]/25 bg-[#63eca9]/5 p-3">
          <VideoThumbnailPreview
            bunnyVideoId={bunnyVideoId}
            title={recordingTitle ?? `Sitzung ${sessionNumber}`}
            className="h-16 w-28 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">{recordingTitle ?? "Aufnahme"}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-white/45">
              {isStorageRecordingRef(bunnyVideoId)
                ? "Bunny Storage"
                : bunnyVideoId}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleClear()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
          >
            Entfernen
          </button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="text-white/60">Videotitel</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-white"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25 disabled:opacity-50"
          >
            {progressLabel}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Storage-CDN-URL oder Stream-GUID einfügen"
            className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !linkInput.trim()}
            onClick={() => void handleLink()}
            className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            Link verknüpfen
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
