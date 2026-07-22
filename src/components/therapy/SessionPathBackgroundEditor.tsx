"use client";

import { useRef, useState, useTransition } from "react";
import { saveSessionPathBackgroundUrl } from "@/app/actions/sessionPathBackground";

type SessionPathBackgroundEditorProps = {
  clientUserId: string;
  clientId: string;
  currentUrl: string;
};

export function SessionPathBackgroundEditor({
  clientUserId,
  clientId,
  currentUrl,
}: SessionPathBackgroundEditorProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const saveUrl = (nextUrl: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSessionPathBackgroundUrl(clientUserId, clientId, nextUrl);
      if (result.ok) {
        setUrl(nextUrl);
        setMessage("Hintergrund gespeichert.");
        setOpen(false);
      } else {
        setMessage(result.error);
      }
    });
  };

  const onUpload = async (file: File) => {
    setMessage(null);
    setUploadPct(0);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("clientId", clientId);

      const res = await fetch("/api/admin/session-path-background/upload", {
        method: "POST",
        body: form,
      });
      setUploadPct(100);
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Upload fehlgeschlagen");
      }
      saveUrl(data.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
        }}
        title="Hintergrundbild bearbeiten"
        aria-label="Hintergrundbild bearbeiten"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/80 backdrop-blur-md transition hover:border-[#63eca9]/50 hover:text-[#63eca9]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="9" cy="10" r="1.6" fill="currentColor" />
          <path
            d="M3 16l5-4 3 2.5 4-5 6 6.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,320px)] rounded-2xl border border-white/15 bg-black/90 p-4 shadow-xl backdrop-blur-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/50">
            Sitzungsakte-Hintergrund
          </p>
          <label className="mb-1 block text-xs text-white/50">Bunny CDN Link</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://….b-cdn.net/…"
            className="mb-3 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !url.trim()}
              onClick={() => saveUrl(url.trim())}
              className="rounded-full bg-[#63eca9] px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50"
            >
              {pending ? "…" : "Link speichern"}
            </button>
            <button
              type="button"
              disabled={pending || uploadPct != null}
              onClick={() => fileRef.current?.click()}
              className="rounded-full border border-white/25 px-4 py-1.5 text-xs text-white/85 hover:bg-white/5 disabled:opacity-50"
            >
              {uploadPct != null ? `Upload ${uploadPct}%` : "Lokal hochladen"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onUpload(file);
            }}
          />
          {message ? (
            <p
              className={`mt-3 text-xs ${
                message.includes("fehlgeschlagen") || message.includes("nicht")
                  ? "text-red-300"
                  : "text-[#63eca9]"
              }`}
            >
              {message}
            </p>
          ) : (
            <p className="mt-3 text-[11px] leading-relaxed text-white/40">
              Lokal hochgeladenes Bild geht direkt zu Bunny Storage/CDN.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
