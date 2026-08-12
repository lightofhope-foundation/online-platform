"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { updateOrbitClientLayout } from "@/app/actions/orbit";
import { remainingProgressRatio } from "@/lib/orbitProgress";
import type { OrbitClientNode, TherapistOrbitData } from "@/lib/therapistOrbitData";

type TherapistOrbitCanvasProps = {
  data: TherapistOrbitData;
};

type DragState = {
  clientUserId: string;
  startPointerY: number;
  startPosY: number;
  side: "left" | "right";
  moved: boolean;
  detailHref: string | null;
};

const MIN_RADIUS = 0.18;
const MAX_RADIUS = 0.42;
const BUBBLE_W = 128;
const BUBBLE_H = 44;
const CENTER_SIZE = 88;
const DRAG_THRESHOLD_PX = 6;

export function TherapistOrbitCanvas({ data }: TherapistOrbitCanvasProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.clients.map((c) => [c.user_id, c.pos_y]))
  );
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onPointerDown = (e: React.PointerEvent, client: OrbitClientNode) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      clientUserId: client.user_id,
      startPointerY: e.clientY,
      startPosY: positions[client.user_id] ?? client.pos_y,
      side: client.side,
      moved: false,
      detailHref: client.detail_href,
    };
    setDraggingId(client.user_id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !containerRef.current) return;
    const height = containerRef.current.clientHeight || 1;
    const deltaPx = e.clientY - drag.startPointerY;
    if (Math.abs(deltaPx) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    const next = Math.min(1, Math.max(0, drag.startPosY + deltaPx / height));
    setPositions((prev) => ({ ...prev, [drag.clientUserId]: next }));
  };

  const finishPointer = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    const posY = positionsRef.current[drag.clientUserId] ?? drag.startPosY;
    const { clientUserId, side, moved, detailHref } = drag;
    dragRef.current = null;
    setDraggingId(null);

    if (moved) {
      startTransition(async () => {
        await updateOrbitClientLayout({
          therapistUserId: data.therapist.user_id,
          clientUserId,
          posY,
          side,
        });
      });
      return;
    }

    if (detailHref) {
      router.push(detailHref);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[560px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(ellipse_at_center,_rgba(99,236,169,0.08)_0%,_transparent_55%),linear-gradient(180deg,_rgba(255,255,255,0.03)_0%,_rgba(0,0,0,0.25)_100%)]"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {data.clients.map((client) => {
          const posY = positions[client.user_id] ?? client.pos_y;
          const radius =
            MIN_RADIUS +
            remainingProgressRatio(client.progress.progressPercent) *
              (MAX_RADIUS - MIN_RADIUS);
          const bx = client.side === "left" ? 50 - radius * 100 : 50 + radius * 100;
          const by = posY * 100;
          return (
            <line
              key={`line-${client.user_id}`}
              x1="50%"
              y1="50%"
              x2={`${bx}%`}
              y2={`${by}%`}
              stroke={
                hoveredId === client.user_id || draggingId === client.user_id
                  ? "rgba(99,236,169,0.7)"
                  : "rgba(255,255,255,0.22)"
              }
              strokeWidth={
                hoveredId === client.user_id || draggingId === client.user_id
                  ? 2
                  : 1.25
              }
            />
          );
        })}
      </svg>

      <div
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#63eca9]/55 bg-[#0f1a16] text-center ring-4 ring-[#0f1a16]"
        style={{ width: CENTER_SIZE, height: CENTER_SIZE }}
      >
        <span className="px-2 text-xs font-semibold text-[#63eca9]">
          {data.therapist.label}
        </span>
      </div>

      {data.clients.length === 0 ? (
        <p className="absolute inset-x-0 bottom-8 text-center text-sm text-white/45">
          Noch keine Klient:innen zugewiesen.
        </p>
      ) : null}

      {data.clients.map((client) => {
        const posY = positions[client.user_id] ?? client.pos_y;
        const radius =
          MIN_RADIUS +
          remainingProgressRatio(client.progress.progressPercent) *
            (MAX_RADIUS - MIN_RADIUS);
        const leftPct =
          client.side === "left" ? 50 - radius * 100 : 50 + radius * 100;
        const isHovered = hoveredId === client.user_id;
        const isDragging = draggingId === client.user_id;

        return (
          <div
            key={client.user_id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none ${
              isHovered || isDragging ? "z-30" : "z-[5]"
            }`}
            style={{
              left: `${leftPct}%`,
              top: `${posY * 100}%`,
            }}
          >
            <button
              type="button"
              className={`relative flex cursor-grab items-center justify-center rounded-2xl border px-3 text-center text-sm outline-none transition active:cursor-grabbing ${
                isHovered || isDragging
                  ? "border-[#63eca9]/70 bg-[#12201a] text-[#63eca9]"
                  : "border-white/20 bg-[#101614] text-white/90 hover:border-white/35"
              }`}
              style={{ width: BUBBLE_W, height: BUBBLE_H }}
              onPointerDown={(e) => onPointerDown(e, client)}
              onPointerMove={onPointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
              onMouseEnter={() => setHoveredId(client.user_id)}
              onMouseLeave={() => {
                if (!isDragging) setHoveredId(null);
              }}
            >
              <span className="truncate px-1">{client.label}</span>
              {isHovered ? (
                <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 w-48 -translate-x-1/2 rounded-xl border border-white/20 bg-[#0b1210] p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,1)] ring-1 ring-black">
                  <p className="text-sm font-medium text-white">{client.label}</p>
                  <p className="mt-1 text-xs text-[#63eca9]">
                    Fortschritt {client.progress.progressPercent}%
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">
                    {client.progress.releasedCount} / {client.progress.totalCount}{" "}
                    Sitzungen freigegeben
                  </p>
                  {client.client_id ? (
                    <p className="mt-0.5 text-xs text-white/45">{client.client_id}</p>
                  ) : null}
                  {client.detail_href ? (
                    <p className="mt-2 text-[11px] text-white/55">
                      Klicken → Akte öffnen
                    </p>
                  ) : null}
                </div>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
