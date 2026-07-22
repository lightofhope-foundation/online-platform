"use client";

import { useState, useTransition } from "react";
import type { TherapySessionWithNotes } from "@/lib/therapySessions";
import { formatTherapySessionLabel } from "@/lib/therapySessions";
import { formatGermanDateTime } from "@/lib/clientId";
import {
  BUBBLE_R,
  buildPathLayout,
  bubbleLabel,
  isArcSegment,
  trimmedSegmentD,
} from "@/lib/therapyPathLayout";

const PATH_INACTIVE_STROKE = "rgba(255,255,255,0.3)";
const SPECIAL_RED = "#f87171";
const SPECIAL_GLOW = "rgba(248,113,113,0.45)";

type SessionPathBubblesProps = {
  sessions: TherapySessionWithNotes[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
  clientView?: boolean;
  therapistName?: string;
  canAddSpecial?: boolean;
  onAddSpecial?: (afterPathOrder: number) => void | Promise<void>;
  highlightSessionId?: string | null;
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
    <div className="session-path-chart overflow-visible rounded-[28px] border border-white/12 bg-white/[0.05] px-2 pb-3 pt-5 sm:px-3 sm:pb-4 sm:pt-6">
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="session-path-chart-path-fade mx-auto block h-auto w-full"
        style={{ maxHeight: "min(62vh, 520px)" }}
        role="img"
        aria-label={`${nodeCount} Sitzungen auf dem Therapiepfad`}
      >
        <defs>
          <filter id="bubble-released-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bubble-special-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1" result="blur" />
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

          const strokeOuter = useRed ? SPECIAL_GLOW : "rgba(99,236,169,0.45)";
          const strokeInner = useRed ? SPECIAL_RED : "#63eca9";

          return (
            <g key={`active-${fromIndex}-${toIndex}`} pointerEvents="none">
              <path
                d={segmentD}
                fill="none"
                stroke={strokeOuter}
                strokeWidth={1.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={segmentD}
                fill="none"
                stroke={strokeInner}
                strokeWidth={0.85}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {canAddSpecial &&
          onAddSpecial &&
          segments.map((segment, idx) => (
            <g
              key={`insert-${segment.fromIndex}-${segment.toIndex}`}
              onMouseEnter={() => setHoveredSegment(idx)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <path
                d={segment.d}
                fill="none"
                stroke="transparent"
                strokeWidth={4}
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => handleAddSpecial(segment.afterPathOrder)}
              />
              {hoveredSegment === idx && (
                <g
                  className="session-path-add-special cursor-pointer"
                  transform={`translate(${segment.mid.x} ${segment.mid.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSpecial(segment.afterPathOrder);
                  }}
                >
                  <circle
                    r={1.9}
                    fill="rgba(190,40,40,0.92)"
                    stroke="rgba(255,180,180,0.9)"
                    strokeWidth={0.22}
                    className="session-path-add-pulse"
                  />
                  <line
                    x1={-0.8}
                    y1={0}
                    x2={0.8}
                    y2={0}
                    stroke="#fff"
                    strokeWidth={0.35}
                    strokeLinecap="round"
                  />
                  <line
                    x1={0}
                    y1={-0.8}
                    x2={0}
                    y2={0.8}
                    stroke="#fff"
                    strokeWidth={0.35}
                    strokeLinecap="round"
                  />
                </g>
              )}
            </g>
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

          const glowFilter =
            isSpecial && released
              ? "url(#bubble-special-glow)"
              : "url(#bubble-released-glow)";
          const glowColor = isSpecial ? "rgba(248,113,113,0.18)" : "rgba(99,236,169,0.14)";
          const glowStroke = isSpecial ? "rgba(248,113,113,0.5)" : "rgba(99,236,169,0.42)";

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
                <>
                  <circle cx={0} cy={0} r={BUBBLE_R + 1.35} fill={glowColor} />
                  <circle
                    cx={0}
                    cy={0}
                    r={BUBBLE_R + 0.85}
                    fill="none"
                    stroke={glowStroke}
                    strokeWidth="0.3"
                    filter={glowFilter}
                  />
                </>
              )}
              <circle cx={0} cy={0} r={BUBBLE_R + 0.2} fill={plateFill} />
              <circle
                cx={0}
                cy={0}
                r={BUBBLE_R}
                fill={plateFill}
                stroke={stroke}
                strokeWidth={selected ? 0.4 : 0.3}
              />
              {selected && (
                <circle
                  cx={0}
                  cy={0}
                  r={BUBBLE_R + 0.5}
                  fill="none"
                  stroke={isSpecial ? "rgba(248,113,113,0.55)" : "rgba(99,236,169,0.5)"}
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
      </svg>

      {clientView ? (
        <p className="mt-3 text-center text-xs text-white/45">
          Grüne Verbindungen und Bubbles = freigegebene Sitzungen. Rote = Sondersitzungen.
        </p>
      ) : canAddSpecial ? (
        <p className="mt-3 text-center text-xs text-white/45">
          Über eine Verbindungslinie hovern und <span className="text-red-300">+</span> klicken,
          um eine Sondersitzung einzufügen.
        </p>
      ) : null}
    </div>
  );
}
