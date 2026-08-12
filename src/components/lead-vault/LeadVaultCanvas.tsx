"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadVaultArea, LeadVaultBoard } from "@/lib/leadVault";
import { accentClass, leadVaultBasePath } from "@/lib/leadVault";
import { updateLeadVaultBoardPosition } from "@/app/actions/leadVault";

function BoardGlyph({ iconKey }: { iconKey: string | null }) {
  if (iconKey === "alien") {
    return (
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-black/70" fill="currentColor">
        <ellipse cx="12" cy="13" rx="7" ry="8" />
        <ellipse cx="9" cy="12" rx="1.4" ry="2.2" className="fill-white/90" />
        <ellipse cx="15" cy="12" rx="1.4" ry="2.2" className="fill-white/90" />
      </svg>
    );
  }
  if (iconKey === "folder") {
    return (
      <svg viewBox="0 0 24 24" className="h-9 w-9 text-black/65" fill="currentColor">
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
      </svg>
    );
  }
  // clipboard default
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-black/65" fill="currentColor">
      <path d="M9 3h6a1 1 0 0 1 1 1v1h1.5A1.5 1.5 0 0 1 19 6.5v13A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5H8V4a1 1 0 0 1 1-1Zm0 2v1h6V5H9Zm3 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    </svg>
  );
}

function childLabel(board: LeadVaultBoard): string {
  const n = board.child_count ?? 0;
  if (board.kind === "lead") return n > 0 ? `${n} cards` : "Lead";
  if (board.kind === "column") return n === 1 ? "1 board" : `${n} boards`;
  if (n === 0) return "leer";
  return n === 1 ? "1 board" : `${n} boards`;
}

type LeadVaultCanvasProps = {
  area: LeadVaultArea;
  boards: LeadVaultBoard[];
  title: string;
};

export function LeadVaultCanvas({ area, boards, title }: LeadVaultCanvasProps) {
  const router = useRouter();
  const base = leadVaultBasePath(area);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => Object.fromEntries(boards.map((b) => [b.id, { x: b.pos_x, y: b.pos_y }]))
  );
  const [, startTransition] = useTransition();
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const maxY = Math.max(480, ...boards.map((b) => (positions[b.id]?.y ?? b.pos_y) + 160));
  const maxX = Math.max(900, ...boards.map((b) => (positions[b.id]?.x ?? b.pos_x) + 160));

  const onPointerDown = (e: React.PointerEvent, board: LeadVaultBoard) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: board.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: positions[board.id]?.x ?? board.pos_x,
      origY: positions[board.id]?.y ?? board.pos_y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    setPositions((prev) => ({
      ...prev,
      [drag.id]: {
        x: Math.max(0, drag.origX + dx),
        y: Math.max(0, drag.origY + dy),
      },
    }));
  };

  const onPointerUp = (board: LeadVaultBoard) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== board.id) return;

    if (!drag.moved) {
      router.push(`${base}/${board.id}`);
      return;
    }

    const pos = positions[board.id] ?? { x: board.pos_x, y: board.pos_y };
    startTransition(async () => {
      await updateLeadVaultBoardPosition(board.id, pos.x, pos.y);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Klientenakte</p>
          <h1 className="mt-1 typo-board-title text-white">{title}</h1>
        </div>
        <p className="hidden text-sm text-white/45 sm:block">
          Klicken = öffnen · Ziehen = verschieben
        </p>
      </div>

      <div
        ref={canvasRef}
        className="relative overflow-auto rounded-[24px] border border-white/10 bg-[#1a1d22]/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        style={{
          minHeight: 520,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        onPointerMove={onPointerMove}
      >
        <div className="relative" style={{ width: maxX, height: maxY }}>
          {boards.map((board) => {
            const pos = positions[board.id] ?? { x: board.pos_x, y: board.pos_y };
            const isColumn = board.kind === "column";

            if (isColumn) {
              return (
                <div
                  key={board.id}
                  className="absolute w-[200px] cursor-grab active:cursor-grabbing rounded-xl border border-white/20 bg-white/[0.92] p-3 shadow-lg"
                  style={{ left: pos.x, top: pos.y }}
                  onPointerDown={(e) => onPointerDown(e, board)}
                  onPointerUp={() => onPointerUp(board)}
                >
                  <div className="border-b border-black/10 pb-2">
                    <div className="font-semibold text-black/80">{board.title}</div>
                    <div className="text-xs text-black/45">{childLabel(board)}</div>
                  </div>
                  <p className="mt-3 text-xs text-black/40">
                    Inhalt beim Öffnen
                  </p>
                </div>
              );
            }

            return (
              <button
                key={board.id}
                type="button"
                className="absolute flex w-[120px] cursor-grab flex-col items-center gap-2 active:cursor-grabbing"
                style={{ left: pos.x, top: pos.y }}
                onPointerDown={(e) => onPointerDown(e, board)}
                onPointerUp={() => onPointerUp(board)}
              >
                <div
                  className={`flex h-[88px] w-[88px] items-center justify-center rounded-2xl shadow-md ${accentClass(board.accent)}`}
                >
                  <BoardGlyph iconKey={board.icon_key} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white/90">{board.title}</div>
                  <div className="text-xs text-white/45">{childLabel(board)}</div>
                </div>
              </button>
            );
          })}

          {boards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white/50">
              Noch keine Boards hier. Seed mit{" "}
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
                npm run seed:lead-vault
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
