"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { TherapySessionWithNotes } from "@/lib/therapySessions";
import { formatTherapySessionLabel } from "@/lib/therapySessions";
import { formatGermanDateTime } from "@/lib/clientId";
import { LOH_LOGO_SRC, LOH_SESSION_PATH_FOOTER, LOH_SESSION_PATH_TAGLINE } from "@/lib/branding";
import {
  BUBBLE_R,
  buildPathLayout,
  bubbleLabel,
  isArcSegment,
  trimmedSegmentD,
} from "@/lib/therapyPathLayout";
import { SessionPathBackgroundEditor } from "./SessionPathBackgroundEditor";

const PATH_INACTIVE_STROKE = "rgba(255,255,255,0.3)";
const SPECIAL_RED = "#f87171";
const SPECIAL_GLOW = "rgba(248,113,113,0.4)";
const ACTIVE_GREEN = "#63eca9";
const ACTIVE_GREEN_GLOW = "rgba(99,236,169,0.4)";

export type SessionPathChrome = {
  title: string;
  backgroundUrl: string;
  subtitle?: ReactNode;
  backLink?: ReactNode;
  canEditBackground?: boolean;
  clientUserId?: string;
  clientId?: string;
};

type SessionPathBubblesProps = {
  sessions: TherapySessionWithNotes[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
  clientView?: boolean;
  therapistName?: string;
  canAddSpecial?: boolean;
  onAddSpecial?: (afterPathOrder: number) => void | Promise<void>;
  highlightSessionId?: string | null;
  pathChrome?: SessionPathChrome | null;
  /** Extra bottom margin + footer line (Admin Sitzungsakte) */
  adminLayout?: boolean;
};

export function SessionPathBubbles({
  sessions,
  selectedSessionId,
  onSelect,
  clientView,
  therapistName,
  canAddSpecial,
  onAddSpecial,
  highlightSessionId,
  pathChrome,
  adminLayout,
}: SessionPathBubblesProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const { nodes, points, segments, viewBox } = buildPathLayout(sessions);
  const nodeCount = nodes.length;

  const handleAddSpecial = (afterPathOrder: number) => {
    if (!onAddSpecial || pending) return;
    startTransition(async () => {
      await onAddSpecial(afterPathOrder);
    });
  };

  return (
    <div className="session-path-chart relative overflow-hidden rounded-[28px] border border-white/12">
      {pathChrome?.backgroundUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pathChrome.backgroundUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-40"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/45" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/40" />
      )}

      <div
        className={[
          "relative z-10 px-3 pt-5 sm:px-5 sm:pt-6",
          adminLayout ? "pb-12 sm:pb-14" : "pb-4 sm:pb-5",
        ].join(" ")}
      >
        {pathChrome ? (
          <div className="mb-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">{pathChrome.backLink}</div>
              {pathChrome.canEditBackground &&
              pathChrome.clientUserId &&
              pathChrome.clientId ? (
                <SessionPathBackgroundEditor
                  clientUserId={pathChrome.clientUserId}
                  clientId={pathChrome.clientId}
                  currentUrl={pathChrome.backgroundUrl}
                />
              ) : null}
            </div>

            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-5 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOH_LOGO_SRC}
                  alt="Light of Hope"
                  className="h-[4.75rem] w-auto max-w-[300px] object-contain opacity-95 sm:h-24 sm:max-w-[340px]"
                />
              </div>
              <h1 className="font-serif text-2xl font-semibold tracking-[0.12em] text-white sm:text-3xl md:text-[2rem]">
                {pathChrome.title}
              </h1>
              <p className="mt-3 text-sm text-white/75 sm:text-base">
                {LOH_SESSION_PATH_TAGLINE}
              </p>
              {pathChrome.subtitle ? (
                <div className="mt-4 text-sm text-white/55">{pathChrome.subtitle}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="session-path-chart-path-fade mx-auto block h-auto w-full"
          style={{ maxHeight: "min(62vh, 520px)" }}
          role="img"
          aria-label={`${nodeCount} Sitzungen auf dem Therapiepfad`}
        >
          <defs>
            <filter id="bubble-soft-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.35" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="path-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {segments.map(({ fromIndex, toIndex, d }) => (
            <path
              key={`base-${fromIndex}-${toIndex}`}
              d={d}
              fill="none"
              stroke={PATH_INACTIVE_STROKE}
              strokeWidth={0.42}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {segments.map(({ fromIndex, toIndex, d }) => {
            const fromSession = nodes[fromIndex];
            const toSession = nodes[toIndex];
            const fromSpecial = fromSession.is_special;
            const toSpecial = toSession.is_special;
            const fromReleased = fromSession.released_to_client;
            const toReleased = toSession.released_to_client;

            if (!fromReleased || !toReleased) return null;

            const useRed = fromSpecial || toSpecial;
            const segmentD = isArcSegment(d)
              ? d
              : trimmedSegmentD(fromIndex, toIndex, nodeCount);
            if (!segmentD) return null;

            const strokeOuter = useRed ? SPECIAL_GLOW : ACTIVE_GREEN_GLOW;
            const strokeInner = useRed ? SPECIAL_RED : ACTIVE_GREEN;

            return (
              <g
                key={`active-${fromIndex}-${toIndex}`}
                pointerEvents="none"
                filter="url(#path-soft-glow)"
              >
                <path
                  d={segmentD}
                  fill="none"
                  stroke={strokeOuter}
                  strokeWidth={1.15}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={segmentD}
                  fill="none"
                  stroke={strokeInner}
                  strokeWidth={0.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Hit-area unter den Bubbles — Hover entlang der Linie */}
          {canAddSpecial &&
            onAddSpecial &&
            segments.map((segment, idx) => (
              <path
                key={`insert-hit-${segment.fromIndex}-${segment.toIndex}`}
                d={segment.d}
                fill="none"
                stroke="transparent"
                strokeWidth={4.5}
                strokeLinecap="round"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => handleAddSpecial(segment.afterPathOrder)}
              />
            ))}

          {nodes.map((session, index) => {
            const { x, y } = points[index];
            const released = session.released_to_client;
            const locked = clientView && !released;
            const selected = selectedSessionId === session.id;
            const isSpecial = session.is_special;
            const isEntering = highlightSessionId === session.id;
            const title = formatTherapySessionLabel(
              session.session_number,
              session.topic,
              session.is_special
            );
            const schedule = session.scheduled_at
              ? formatGermanDateTime(session.scheduled_at)
              : null;

            const tooltip = locked
              ? `Dein Therapeut ${therapistName ?? ""} hat die Sitzung noch nicht freigegeben.`.trim()
              : [title, schedule, session.meeting_url].filter(Boolean).join(" · ");

            const plateFill = locked
              ? "rgba(36, 42, 40, 0.96)"
              : selected
                ? isSpecial
                  ? "rgba(92, 44, 44, 0.96)"
                  : "rgba(58, 98, 76, 0.96)"
                : released
                  ? isSpecial
                    ? "rgba(82, 38, 38, 0.96)"
                    : "rgba(54, 92, 72, 0.96)"
                  : isSpecial
                    ? "rgba(52, 32, 32, 0.96)"
                    : "rgba(40, 46, 44, 0.96)";

            const stroke = locked
              ? "rgba(255,255,255,0.22)"
              : selected
                ? isSpecial
                  ? "rgba(248,113,113,0.95)"
                  : "rgba(99,236,169,0.9)"
                : released
                  ? isSpecial
                    ? "rgba(248,113,113,0.95)"
                    : "rgba(99,236,169,0.95)"
                  : isSpecial
                    ? "rgba(248,113,113,0.55)"
                    : "rgba(255,255,255,0.32)";

            const textFill = locked
              ? "rgba(255,255,255,0.42)"
              : released && !selected
                ? isSpecial
                  ? "#ffd0d0"
                  : "#b8ffd9"
                : "#f8fffc";

            const glowHalo = isSpecial
              ? "rgba(248,113,113,0.22)"
              : "rgba(99,236,169,0.22)";

            return (
              <g
                key={session.id}
                className={[
                  locked
                    ? "cursor-not-allowed outline-none"
                    : "session-path-bubble cursor-pointer outline-none focus:outline-none focus-visible:outline-none",
                  isEntering ? "session-path-bubble-enter" : "",
                ].join(" ")}
                transform={`translate(${x} ${y})`}
                onClick={() => !locked && onSelect(session.id)}
                onKeyDown={(e) => {
                  if (!locked && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(session.id);
                  }
                }}
                role="button"
                aria-label={tooltip}
                aria-disabled={locked}
                aria-current={selected ? "true" : undefined}
              >
                {released && (
                  <circle
                    cx={0}
                    cy={0}
                    r={BUBBLE_R + 1.15}
                    fill={glowHalo}
                    filter="url(#bubble-soft-glow)"
                  />
                )}
                <circle cx={0} cy={0} r={BUBBLE_R + 0.2} fill={plateFill} />
                <circle
                  cx={0}
                  cy={0}
                  r={BUBBLE_R}
                  fill={plateFill}
                  stroke={stroke}
                  strokeWidth={selected ? 0.4 : released ? 0.38 : 0.3}
                />
                {selected && (
                  <circle
                    cx={0}
                    cy={0}
                    r={BUBBLE_R + 0.5}
                    fill="none"
                    stroke={
                      isSpecial ? "rgba(248,113,113,0.55)" : "rgba(99,236,169,0.55)"
                    }
                    strokeWidth="0.22"
                  />
                )}
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textFill}
                  fontSize={isSpecial ? "3.2" : "3.55"}
                  fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {bubbleLabel(session)}
                </text>
                {released && !clientView && (
                  <circle
                    cx={BUBBLE_R * 0.72}
                    cy={-BUBBLE_R * 0.72}
                    r={0.8}
                    fill={isSpecial ? SPECIAL_RED : "#63eca9"}
                    stroke="#2a3834"
                    strokeWidth="0.18"
                  />
                )}
              </g>
            );
          })}

          {canAddSpecial &&
            onAddSpecial &&
            segments.map((segment, idx) => (
              <g
                key={`insert-${segment.fromIndex}-${segment.toIndex}`}
                className="session-path-add-special cursor-pointer"
                transform={`translate(${segment.mid.x} ${segment.mid.y})`}
                opacity={hoveredSegment === idx ? 1 : 0.4}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSpecial(segment.afterPathOrder);
                }}
              >
                <circle r={2.4} fill="transparent" />
                <circle
                  r={hoveredSegment === idx ? 1.9 : 1.35}
                  fill="rgba(190,40,40,0.92)"
                  stroke="rgba(255,180,180,0.9)"
                  strokeWidth={0.22}
                  className={
                    hoveredSegment === idx ? "session-path-add-pulse" : undefined
                  }
                />
                <line
                  x1={-0.7}
                  y1={0}
                  x2={0.7}
                  y2={0}
                  stroke="#fff"
                  strokeWidth={0.32}
                  strokeLinecap="round"
                />
                <line
                  x1={0}
                  y1={-0.7}
                  x2={0}
                  y2={0.7}
                  stroke="#fff"
                  strokeWidth={0.32}
                  strokeLinecap="round"
                />
              </g>
            ))}
        </svg>

        {clientView ? (
          <p className="mt-3 text-center text-xs text-white/45">
            Grüne Verbindungen und Bubbles = freigegebene Sitzungen. Rote = Notsitzungen.
          </p>
        ) : canAddSpecial ? (
          <p className="mt-3 text-center text-xs text-white/45">
            Über eine Verbindungslinie hovern und <span className="text-red-300">+</span>{" "}
            klicken, um eine Notsitzung einzufügen.
          </p>
        ) : adminLayout ? (
          <p className="mt-3 text-center text-xs text-white/45">
            Admin-Ansicht — Freigaben und Notizen wie beim Therapeuten (inkl. Änderungszähler).
          </p>
        ) : null}

        {adminLayout ? (
          <p className="mt-8 text-right text-sm tracking-wide text-[#63eca9]/85">
            <span className="mr-1.5 text-[#63eca9]" aria-hidden>
              ♥
            </span>
            {LOH_SESSION_PATH_FOOTER}
          </p>
        ) : null}
      </div>
    </div>
  );
}
