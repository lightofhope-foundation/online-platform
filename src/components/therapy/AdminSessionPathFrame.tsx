"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ViewMode = "drag" | "zoom" | "preset" | null;
type PresetId = "compact" | "normal" | "wide";

const STORAGE_KEY = "loh-admin-session-path-view";

type StoredState = {
  mode: ViewMode;
  widthPct: number;
  zoom: number;
  preset: PresetId;
};

const DEFAULTS: StoredState = {
  mode: null,
  widthPct: 100,
  zoom: 1,
  preset: "normal",
};

const PRESET_WIDTH: Record<PresetId, number> = {
  compact: 78,
  normal: 92,
  wide: 100,
};

function readStored(): StoredState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      mode:
        parsed.mode === "drag" ||
        parsed.mode === "zoom" ||
        parsed.mode === "preset"
          ? parsed.mode
          : null,
      widthPct:
        typeof parsed.widthPct === "number"
          ? Math.min(100, Math.max(55, parsed.widthPct))
          : DEFAULTS.widthPct,
      zoom:
        typeof parsed.zoom === "number"
          ? Math.min(1.35, Math.max(0.7, parsed.zoom))
          : DEFAULTS.zoom,
      preset:
        parsed.preset === "compact" ||
        parsed.preset === "normal" ||
        parsed.preset === "wide"
          ? parsed.preset
          : DEFAULTS.preset,
    };
  } catch {
    return DEFAULTS;
  }
}

function clearPanelScale(panel: HTMLElement) {
  panel.style.width = "";
  panel.style.maxWidth = "";
  panel.style.marginLeft = "";
  panel.style.marginRight = "";
  panel.style.transform = "";
  panel.style.transformOrigin = "";
  panel.style.transition = "";
  panel.style.position = "";
}

function IconHand({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 11V6.5a1.5 1.5 0 013 0V11M11 10.5V5a1.5 1.5 0 013 0v6.5M14 11V7a1.5 1.5 0 013 0v8c0 3-1.5 5-4.5 5H12c-3.5 0-6-2-6-5.5V12a1.5 1.5 0 013 0v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? "opacity-100" : "opacity-80"}
      />
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        className={active ? "opacity-100" : "opacity-80"}
      />
      <path
        d="M16 16l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSheet({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
        className={active ? "opacity-100" : "opacity-80"}
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type AdminSessionPathFrameProps = {
  children: ReactNode;
};

/**
 * Admin-only: exclusive view modes scale the outermost shell content panel
 * (GlassPanel / Legacy section) — Hand = drag width · Loupe = zoom · Sheet = presets.
 */
export function AdminSessionPathFrame({ children }: AdminSessionPathFrameProps) {
  const [state, setState] = useState<StoredState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  useEffect(() => {
    const panel = anchorRef.current?.closest(
      "[data-shell-content-panel]"
    ) as HTMLElement | null;
    setPanelEl(panel);
  }, [hydrated]);

  const setMode = (next: ViewMode) => {
    setState((prev) => ({
      ...prev,
      mode: prev.mode === next ? null : next,
    }));
  };

  const effectiveWidth =
    state.mode === "preset"
      ? PRESET_WIDTH[state.preset]
      : state.mode === "drag"
        ? state.widthPct
        : 100;

  const effectiveZoom = state.mode === "zoom" ? state.zoom : 1;

  useEffect(() => {
    if (!panelEl) return;

    panelEl.style.transition =
      "width 200ms ease-out, transform 200ms ease-out";
    panelEl.style.marginLeft = "auto";
    panelEl.style.marginRight = "auto";
    panelEl.style.maxWidth = "100%";
    panelEl.style.width = `${effectiveWidth}%`;
    panelEl.style.transformOrigin = "top center";
    panelEl.style.transform =
      effectiveZoom !== 1 ? `scale(${effectiveZoom})` : "";

    if (state.mode === "drag") {
      const computed = window.getComputedStyle(panelEl).position;
      if (computed === "static") {
        panelEl.style.position = "relative";
      }
    } else if (panelEl.style.position === "relative") {
      panelEl.style.position = "";
    }
  }, [panelEl, effectiveWidth, effectiveZoom, state.mode]);

  useEffect(() => {
    if (!panelEl) return;
    return () => {
      clearPanelScale(panelEl);
    };
  }, [panelEl]);

  const onDragStart = useCallback(
    (clientX: number) => {
      if (state.mode !== "drag") return;
      dragRef.current = { startX: clientX, startWidth: state.widthPct };
    },
    [state.mode, state.widthPct]
  );

  useEffect(() => {
    if (state.mode !== "drag") return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current || !panelEl?.parentElement) return;
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX == null) return;
      const parentW = panelEl.parentElement.getBoundingClientRect().width;
      if (parentW <= 0) return;
      const deltaPct = ((clientX - dragRef.current.startX) / parentW) * 100;
      const next = Math.min(
        100,
        Math.max(55, dragRef.current.startWidth + deltaPct)
      );
      setState((prev) => ({ ...prev, widthPct: next }));
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [state.mode, panelEl]);

  const modes: {
    id: Exclude<ViewMode, null>;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "drag",
      label: "Breite ziehen",
      icon: <IconHand active={state.mode === "drag"} />,
    },
    {
      id: "zoom",
      label: "Zoom",
      icon: <IconSearch active={state.mode === "zoom"} />,
    },
    {
      id: "preset",
      label: "Vorlagen",
      icon: <IconSheet active={state.mode === "preset"} />,
    },
  ];

  return (
    <div ref={anchorRef} className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          className="flex items-center gap-0.5 rounded-full border border-white/12 bg-black/40 p-1 backdrop-blur-md"
          role="group"
          aria-label="Ansichtsmodus Sitzungsakte"
        >
          {modes.map((m) => {
            const on = state.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                title={m.label}
                aria-pressed={on}
                onClick={() => setMode(m.id)}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  on
                    ? "bg-[#63eca9]/20 text-[#63eca9] shadow-[0_0_12px_rgba(99,236,169,0.2)]"
                    : "text-white/45 hover:text-white/80",
                ].join(" ")}
              >
                {m.icon}
              </button>
            );
          })}
        </div>

        {state.mode === "zoom" ? (
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1.5">
            <button
              type="button"
              className="text-xs text-white/60 hover:text-white"
              onClick={() =>
                setState((p) => ({
                  ...p,
                  zoom: Math.max(0.7, Math.round((p.zoom - 0.05) * 100) / 100),
                }))
              }
            >
              −
            </button>
            <input
              type="range"
              min={70}
              max={135}
              value={Math.round(state.zoom * 100)}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  zoom: Number(e.target.value) / 100,
                }))
              }
              className="h-1 w-28 accent-[#63eca9]"
              aria-label="Zoom"
            />
            <button
              type="button"
              className="text-xs text-white/60 hover:text-white"
              onClick={() =>
                setState((p) => ({
                  ...p,
                  zoom: Math.min(1.35, Math.round((p.zoom + 0.05) * 100) / 100),
                }))
              }
            >
              +
            </button>
            <span className="w-10 text-right text-[11px] text-white/50">
              {Math.round(state.zoom * 100)}%
            </span>
          </div>
        ) : null}

        {state.mode === "preset" ? (
          <div className="flex gap-1 rounded-full border border-white/12 bg-black/35 p-1">
            {(
              [
                ["compact", "Kompakt"],
                ["normal", "Normal"],
                ["wide", "Breit"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setState((p) => ({ ...p, preset: id }))}
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  state.preset === id
                    ? "bg-[#63eca9]/20 text-[#63eca9]"
                    : "text-white/45 hover:text-white/80",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {state.mode === "drag" ? (
          <span className="text-[11px] text-white/40">
            Am rechten Rand ziehen · {Math.round(state.widthPct)}%
          </span>
        ) : null}
      </div>

      {children}

      {state.mode === "drag" && panelEl
        ? createPortal(
            <button
              type="button"
              aria-label="Breite anpassen"
              onMouseDown={(e) => {
                e.preventDefault();
                onDragStart(e.clientX);
              }}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) onDragStart(t.clientX);
              }}
              className="absolute inset-y-3 -right-1.5 z-30 w-3 cursor-ew-resize rounded-full border border-[#63eca9]/35 bg-[#63eca9]/15 hover:bg-[#63eca9]/30"
            />,
            panelEl
          )
        : null}
    </div>
  );
}
