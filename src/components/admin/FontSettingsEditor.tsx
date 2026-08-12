"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useFontTheme } from "@/components/FontThemeProvider";
import { FONT_OPTIONS, fontStack, type FontId } from "@/lib/platformFonts";
import { getTokenStyle } from "@/lib/typographyConfig";
import {
  CORE_TOKEN_IDS,
  TYPOGRAPHY_BY_ID,
  TYPOGRAPHY_REGISTRY,
  roleLabel,
  usageCount,
  type TypographyToken,
} from "@/lib/typographyRegistry";

function FontSelect({
  value,
  onChange,
  id,
}: {
  value: FontId;
  onChange: (id: FontId) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = FONT_OPTIONS.find((f) => f.id === value) ?? FONT_OPTIONS[0];
  const loh = FONT_OPTIONS.filter((f) => f.group === "loh");
  const defaults = FONT_OPTIONS.filter((f) => f.group === "default");

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const renderGroup = (label: string, options: typeof FONT_OPTIONS) => (
    <div key={label} className="py-1">
      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#63eca9]/70">
        {label}
      </div>
      {options.map((f) => {
        const active = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            role="option"
            aria-selected={active}
            className={[
              "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
              active
                ? "bg-[#63eca9]/15 text-[#63eca9]"
                : "text-white/85 hover:bg-white/[0.06] hover:text-white",
            ].join(" ")}
            style={{ fontFamily: fontStack(f.id) }}
            onClick={() => {
              onChange(f.id);
              setOpen(false);
            }}
          >
            <span className="flex-1 truncate">{f.label}</span>
            {active ? <span className="ml-2 text-[#63eca9]">✓</span> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-black/55 px-3 py-2.5 text-left text-sm text-white outline-none transition",
          open
            ? "border-[#63eca9]/55 shadow-[0_0_0_1px_rgba(99,236,169,0.2)]"
            : "border-white/15 hover:border-white/25",
        ].join(" ")}
      >
        <span className="truncate" style={{ fontFamily: fontStack(value) }}>
          {selected.label}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className={`shrink-0 text-white/50 transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border border-white/12 bg-[#12151a]/98 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          {renderGroup("LoH-Website fonts", loh)}
          <div className="mx-3 border-t border-white/10" />
          {renderGroup("Default Fonts", defaults)}
        </div>
      ) : null}
    </div>
  );
}

function UsageDetails({ token }: { token: TypographyToken }) {
  const [open, setOpen] = useState(false);
  const count = usageCount(token);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-xs text-white/45 hover:text-[#63eca9]"
      >
        {count}× verwendet · {open ? "einklappen" : "Seiten/Rollen anzeigen"}
      </button>
      {open ? (
        <ul
          className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/60"
          onClick={(e) => e.stopPropagation()}
        >
          {token.usages.map((u) => (
            <li key={`${u.role}-${u.path}`} className="flex flex-wrap gap-x-2">
              <span className="text-[#63eca9]/80">{roleLabel(u.role)}</span>
              <span>{u.pageLabel}</span>
              <span className="text-white/30">{u.path}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AddTokenModal({
  open,
  pinned,
  onClose,
  onAdd,
}: {
  open: boolean;
  pinned: string[];
  onClose: () => void;
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TYPOGRAPHY_REGISTRY.filter((t) => {
      if (pinned.includes(t.id)) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.className.toLowerCase().includes(q)
      );
    });
  }, [pinned, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#12151a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-medium text-white">Typografie-Klasse hinzufügen</h2>
            <p className="mt-0.5 text-xs text-white/45">
              Klasse wählen — gilt dann auf allen Rollen/Seiten, die sie nutzen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 hover:border-white/30 hover:text-white"
          >
            Schließen
          </button>
        </div>
        <div className="border-b border-white/10 px-5 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen (Klasse, Beschreibung…)"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#63eca9]/45"
          />
        </div>
        <div className="flex-1 overflow-auto p-3">
          {available.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-white/45">
              Keine weiteren Klassen verfügbar.
            </p>
          ) : (
            <ul className="space-y-2">
              {available.map((token) => (
                <li key={token.id}>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-[#63eca9]/35 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onAdd(token.id);
                          onClose();
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-sm text-white">
                          <span className="font-medium text-[#63eca9]">
                            {token.className}
                          </span>
                          <span className="text-white/50">
                            {" "}
                            ({token.description})
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-white/40">
                          {usageCount(token)} Verwendungen · Default:{" "}
                          {token.defaultFont} / {token.defaultSizePx}px
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAdd(token.id);
                          onClose();
                        }}
                        className="shrink-0 rounded-full bg-[#63eca9]/15 px-2 py-0.5 text-xs text-[#63eca9]"
                        aria-label={`${token.className} hinzufügen`}
                      >
                        +
                      </button>
                    </div>
                    <UsageDetails token={token} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function FontSettingsEditor() {
  const { config, saving, setTokenFont, setTokenSize, pinToken, unpinToken } =
    useFontTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const pinnedTokens = config.pinned
    .map((id) => TYPOGRAPHY_BY_ID[id])
    .filter(Boolean) as TypographyToken[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/55">
          Kern-Klassen sind immer sichtbar. Über <strong className="text-white/80">+</strong>{" "}
          weitere Überschriften/Textklassen hinzufügen — Änderungen gelten auf allen
          Rollen und Seiten, die die Klasse nutzen.
          {saving ? (
            <span className="ml-2 text-[#63eca9]">Speichern…</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#63eca9]/40 bg-[#63eca9]/15 px-4 py-2 text-sm font-medium text-[#63eca9] transition hover:bg-[#63eca9]/25"
        >
          <span className="text-lg leading-none">+</span>
          Klasse hinzufügen
        </button>
      </div>

      <div className="space-y-4">
        {pinnedTokens.map((token) => {
          const style = getTokenStyle(config, token.id);
          const canRemove = !CORE_TOKEN_IDS.includes(token.id);
          return (
            <div
              key={token.id}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-white">
                      <span className="text-[#63eca9]">{token.className}</span>
                      <span className="font-normal text-white/50">
                        {" "}
                        ({token.description})
                      </span>
                    </div>
                    <UsageDetails token={token} />
                  </div>
                  {canRemove ? (
                    <button
                      type="button"
                      onClick={() => void unpinToken(token.id)}
                      className="shrink-0 text-xs text-white/35 hover:text-red-300"
                      title="Aus Einstellungen entfernen (Klasse bleibt im Code)"
                    >
                      Entfernen
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/35">
                      Kern
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-stretch gap-2">
                  <FontSelect
                    id={`font-${token.id}`}
                    value={style.font}
                    onChange={(id) => void setTokenFont(token.id, id)}
                  />
                  <label className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-wide text-white/40">
                      Größe
                    </span>
                    <input
                      type="number"
                      min={token.sizeMin}
                      max={token.sizeMax}
                      step={1}
                      value={style.sizePx}
                      onChange={(e) =>
                        void setTokenSize(token.id, Number(e.target.value))
                      }
                      className="w-14 bg-transparent text-sm tabular-nums text-white outline-none"
                    />
                    <span className="text-xs text-white/35">px</span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-5">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-white/35">
                  Vorschau
                </div>
                <p
                  className="text-white"
                  style={{
                    fontFamily: fontStack(style.font),
                    fontSize: `${style.sizePx}px`,
                    lineHeight: 1.25,
                  }}
                >
                  {token.description.replace(/^Überschr\.\s*/, "").replace(/[„“]/g, "") ||
                    token.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AddTokenModal
        open={modalOpen}
        pinned={config.pinned}
        onClose={() => setModalOpen(false)}
        onAdd={(id) => void pinToken(id)}
      />
    </div>
  );
}
