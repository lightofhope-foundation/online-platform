"use client";

import type { TherapySessionWithNotes } from "@/lib/therapySessions";
import { formatGermanDateTime } from "@/lib/clientId";

const COLS = 4;
const COL_X = [10, 35, 60, 85];
const ROW_Y = [10, 35, 60, 85];
const TURN_R = (ROW_Y[1] - ROW_Y[0]) / 2;
const BUBBLE_R = 4.2;

const PATH_INACTIVE_STROKE = "rgba(255,255,255,0.3)";

/** Linie von Bubble-Rand zu Bubble-Rand — sichtbar zwischen den Kreisen */
function trimmedLineD(from: number, to: number): string {
  const a = sessionPosition(from);
  const b = sessionPosition(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return "";
  const pad = BUBBLE_R + 0.15;
  const sx = a.x + (dx / len) * pad;
  const sy = a.y + (dy / len) * pad;
  const ex = b.x - (dx / len) * pad;
  const ey = b.y - (dy / len) * pad;
  return `M ${sx} ${sy} L ${ex} ${ey}`;
}

function isArcSegment(d: string): boolean {
  return d.includes(" A ");
}

function sessionPosition(n: number): { x: number; y: number } {
  const row = Math.floor((n - 1) / COLS);
  const posInRow = (n - 1) % COLS;
  const rtl = row % 2 === 1;
  const col = rtl ? COLS - 1 - posInRow : posInRow;
  return { x: COL_X[col], y: ROW_Y[row] };
}

const PATH_NODES = Array.from({ length: 14 }, (_, i) => {
  const n = i + 1;
  return { n, ...sessionPosition(n) };
});

/** Einzelsegmente 1→2→…→14 für farbige Freigabe-Logik */
const PATH_SEGMENTS: { from: number; to: number; d: string }[] = [
  { from: 1, to: 2, d: `M ${COL_X[0]} ${ROW_Y[0]} L ${COL_X[1]} ${ROW_Y[0]}` },
  { from: 2, to: 3, d: `M ${COL_X[1]} ${ROW_Y[0]} L ${COL_X[2]} ${ROW_Y[0]}` },
  { from: 3, to: 4, d: `M ${COL_X[2]} ${ROW_Y[0]} L ${COL_X[3]} ${ROW_Y[0]}` },
  {
    from: 4,
    to: 5,
    d: `M ${COL_X[3]} ${ROW_Y[0]} A ${TURN_R} ${TURN_R} 0 0 1 ${COL_X[3]} ${ROW_Y[1]}`,
  },
  { from: 5, to: 6, d: `M ${COL_X[3]} ${ROW_Y[1]} L ${COL_X[2]} ${ROW_Y[1]}` },
  { from: 6, to: 7, d: `M ${COL_X[2]} ${ROW_Y[1]} L ${COL_X[1]} ${ROW_Y[1]}` },
  { from: 7, to: 8, d: `M ${COL_X[1]} ${ROW_Y[1]} L ${COL_X[0]} ${ROW_Y[1]}` },
  {
    from: 8,
    to: 9,
    d: `M ${COL_X[0]} ${ROW_Y[1]} A ${TURN_R} ${TURN_R} 0 0 0 ${COL_X[0]} ${ROW_Y[2]}`,
  },
  { from: 9, to: 10, d: `M ${COL_X[0]} ${ROW_Y[2]} L ${COL_X[1]} ${ROW_Y[2]}` },
  { from: 10, to: 11, d: `M ${COL_X[1]} ${ROW_Y[2]} L ${COL_X[2]} ${ROW_Y[2]}` },
  { from: 11, to: 12, d: `M ${COL_X[2]} ${ROW_Y[2]} L ${COL_X[3]} ${ROW_Y[2]}` },
  {
    from: 12,
    to: 13,
    d: `M ${COL_X[3]} ${ROW_Y[2]} A ${TURN_R} ${TURN_R} 0 0 1 ${COL_X[3]} ${ROW_Y[3]}`,
  },
  { from: 13, to: 14, d: `M ${COL_X[3]} ${ROW_Y[3]} L ${COL_X[2]} ${ROW_Y[3]}` },
];

type SessionPathBubblesProps = {
  sessions: TherapySessionWithNotes[];
  selectedNumber: number | null;
  onSelect: (sessionNumber: number) => void;
  clientView?: boolean;
  therapistName?: string;
};

function sessionByNumber(
  sessions: TherapySessionWithNotes[],
  n: number
): TherapySessionWithNotes | undefined {
  return sessions.find((s) => s.session_number === n);
}

function isReleased(sessions: TherapySessionWithNotes[], n: number): boolean {
  return sessionByNumber(sessions, n)?.released_to_client ?? false;
}

export function SessionPathBubbles({
  sessions,
  selectedNumber,
  onSelect,
  clientView,
  therapistName,
}: SessionPathBubblesProps) {
  return (
    <div className="session-path-chart rounded-[28px] border border-white/12 bg-white/[0.05] p-3 sm:p-4">
      <svg
        viewBox="0 0 100 100"
        className="mx-auto block h-auto w-full"
        style={{ maxHeight: "min(72vh, 560px)" }}
        role="img"
        aria-label="14 Sitzungen auf dem Therapiepfad"
      >
        <defs>
          <filter id="bubble-released-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Basis-Pfad: immer alle Segmente (auch unter freigegebenen) */}
        {PATH_SEGMENTS.map(({ from, to, d }) => (
          <path
            key={`base-${from}-${to}`}
            d={d}
            fill="none"
            stroke={PATH_INACTIVE_STROKE}
            strokeWidth={0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Grüne Verbindungen unter den Bubbles — Lücken sichtbar, keine Überlappung auf den Kreisen */}
        {PATH_SEGMENTS.map(({ from, to, d }) => {
          const active = isReleased(sessions, from) && isReleased(sessions, to);
          if (!active) return null;
          const segmentD = isArcSegment(d) ? d : trimmedLineD(from, to);
          if (!segmentD) return null;
          return (
            <g key={`active-${from}-${to}`} pointerEvents="none">
              <path
                d={segmentD}
                fill="none"
                stroke="rgba(99,236,169,0.45)"
                strokeWidth={1.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={segmentD}
                fill="none"
                stroke="#63eca9"
                strokeWidth={0.85}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {PATH_NODES.map(({ n, x, y }) => {
          const session = sessionByNumber(sessions, n);
          if (!session) return null;

          const released = session.released_to_client;
          const locked = clientView && !released;
          const selected = selectedNumber === n;
          const title = session.topic?.trim() || `Sitzung ${n}`;
          const schedule = session.scheduled_at
            ? formatGermanDateTime(session.scheduled_at)
            : null;

          const tooltip = locked
            ? `Dein Therapeut ${therapistName ?? ""} hat die Sitzung noch nicht freigegeben.`.trim()
            : [title, schedule, session.meeting_url].filter(Boolean).join(" · ");

          const plateFill = locked
            ? "rgba(36, 42, 40, 0.96)"
            : selected
              ? "rgba(58, 98, 76, 0.96)"
              : released
                ? "rgba(54, 92, 72, 0.96)"
                : "rgba(40, 46, 44, 0.96)";

          const stroke = locked
            ? "rgba(255,255,255,0.22)"
            : selected
              ? "rgba(99,236,169,0.9)"
              : released
                ? "rgba(99,236,169,0.95)"
                : "rgba(255,255,255,0.32)";

          const textFill = locked
            ? "rgba(255,255,255,0.42)"
            : released && !selected
              ? "#b8ffd9"
              : "#f8fffc";

          return (
            <g
              key={n}
              className={
                locked
                  ? "cursor-not-allowed outline-none"
                  : "session-path-bubble cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
              }
              onClick={() => !locked && onSelect(n)}
              onKeyDown={(e) => {
                if (!locked && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(n);
                }
              }}
              role="button"
              aria-label={tooltip}
              aria-disabled={locked}
              aria-current={selected ? "true" : undefined}
            >
              {released && (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r={BUBBLE_R + 1.6}
                    fill="rgba(99,236,169,0.14)"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={BUBBLE_R + 1}
                    fill="none"
                    stroke="rgba(99,236,169,0.42)"
                    strokeWidth="0.35"
                    filter="url(#bubble-released-glow)"
                  />
                </>
              )}
              <circle cx={x} cy={y} r={BUBBLE_R + 0.25} fill={plateFill} />
              <circle
                cx={x}
                cy={y}
                r={BUBBLE_R}
                fill={plateFill}
                stroke={stroke}
                strokeWidth={selected ? 0.45 : 0.35}
              />
              {selected && (
                <circle
                  cx={x}
                  cy={y}
                  r={BUBBLE_R + 0.55}
                  fill="none"
                  stroke="rgba(99,236,169,0.5)"
                  strokeWidth="0.25"
                />
              )}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textFill}
                fontSize="3.8"
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {n}
              </text>
              {released && !clientView && (
                <circle
                  cx={x + BUBBLE_R * 0.72}
                  cy={y - BUBBLE_R * 0.72}
                  r={0.9}
                  fill="#63eca9"
                  stroke="#2a3834"
                  strokeWidth="0.2"
                />
              )}
            </g>
          );
        })}
      </svg>

      {clientView && (
        <p className="mt-3 text-center text-xs text-white/45">
          Grüne Verbindungen und Bubbles = freigegebene Sitzungen.
        </p>
      )}
    </div>
  );
}
