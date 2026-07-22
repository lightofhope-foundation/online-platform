"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BunnyEmbedPlayer } from "./BunnyEmbedPlayer";

type BunnyVideoModalProps = {
  open: boolean;
  onClose: () => void;
  bunnyLibraryId: string;
  bunnyVideoId: string;
  title: string;
  subtitle?: string;
};

export function BunnyVideoModal({
  open,
  onClose,
  bunnyLibraryId,
  bunnyVideoId,
  title,
  subtitle,
}: BunnyVideoModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
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
      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div
          className="relative z-10 flex w-full max-w-[min(96vw,1200px)] flex-col gap-4 rounded-[24px] border border-white/15 bg-[#121212] p-4 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-white/50">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              Schließen
            </button>
          </div>

          <BunnyEmbedPlayer
            key={bunnyVideoId}
            libraryId={bunnyLibraryId}
            bunnyVideoId={bunnyVideoId}
            title={title}
            autoPlay
          />

          <p className="text-center text-xs text-white/35">
            Vollbild über den Player-Button unten rechts
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
