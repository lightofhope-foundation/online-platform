import type { TherapySessionWithNotes } from "@/lib/therapySessions";

export const PATH_COLS = 8;
export const PATH_MARGIN_Y = 10;
/** Vertical distance between row centers */
export const ROW_GAP = 32;
/** Fixed center-to-center distance — keeps spacing when bubble size changes */
export const COL_STEP = 17;
/** Bubble radius in viewBox units — keep in sync with SessionPathBubbles */
export const BUBBLE_R = 3.85;
const LINE_PAD = BUBBLE_R + 0.35;

function getColX(): number[] {
  const start = 6;
  return Array.from({ length: PATH_COLS }, (_, i) => start + i * COL_STEP);
}

export type PathPoint = { x: number; y: number };

export type PathSegment = {
  fromIndex: number;
  toIndex: number;
  afterPathOrder: number;
  d: string;
  mid: PathPoint;
};

export function sortSessionsOnPath(
  sessions: TherapySessionWithNotes[]
): TherapySessionWithNotes[] {
  return [...sessions].sort((a, b) => a.path_order - b.path_order);
}

function rowY(row: number): number {
  return PATH_MARGIN_Y + row * ROW_GAP;
}

export function pathIndexToPoint(index: number, nodeCount: number): PathPoint {
  const colX = getColX();
  const row = Math.floor(index / PATH_COLS);
  const posInRow = index % PATH_COLS;
  const rtl = row % 2 === 1;
  const col = rtl ? PATH_COLS - 1 - posInRow : posInRow;
  return { x: colX[col], y: rowY(row) };
}

function trimmedLine(
  from: PathPoint,
  to: PathPoint,
  options?: { trimStart?: boolean; trimEnd?: boolean }
): string {
  const trimStart = options?.trimStart ?? true;
  const trimEnd = options?.trimEnd ?? true;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return "";
  const sx = trimStart ? from.x + (dx / len) * LINE_PAD : from.x;
  const sy = trimStart ? from.y + (dy / len) * LINE_PAD : from.y;
  const ex = trimEnd ? to.x - (dx / len) * LINE_PAD : to.x;
  const ey = trimEnd ? to.y - (dy / len) * LINE_PAD : to.y;
  return `M ${sx} ${sy} L ${ex} ${ey}`;
}

/** Semicircular row turn — flush with horizontal row lines at y0 / y1 */
function uTurnArc(from: PathPoint, to: PathPoint, row: number): string {
  const x = from.x;
  const y0 = from.y;
  const y1 = to.y;
  const arcR = (y1 - y0) / 2;
  if (arcR <= 0.5) return "";
  const sweep = row % 2 === 0 ? 1 : 0;
  return `M ${x} ${y0} A ${arcR} ${arcR} 0 0 ${sweep} ${x} ${y1}`;
}

function turnMidpoint(from: PathPoint, to: PathPoint, row: number): PathPoint {
  const x = from.x;
  const arcR = (to.y - from.y) / 2;
  const bulge = row % 2 === 0 ? arcR : -arcR;
  return { x: x + bulge, y: (from.y + to.y) / 2 };
}

function segmentMidpoint(from: PathPoint, to: PathPoint, row: number): PathPoint {
  if (Math.abs(from.y - to.y) < 0.01) {
    const dx = to.x - from.x;
    const len = Math.abs(dx);
    if (len <= LINE_PAD * 2) return { x: (from.x + to.x) / 2, y: from.y };
    const sx = from.x + (dx / len) * LINE_PAD;
    const ex = to.x - (dx / len) * LINE_PAD;
    return { x: (sx + ex) / 2, y: from.y };
  }
  return turnMidpoint(from, to, row);
}

function turnBulge(): number {
  return ROW_GAP / 2;
}

function computeViewBox(nodeCount: number): string {
  const colX = getColX();
  const numRows = Math.max(1, Math.ceil(nodeCount / PATH_COLS));
  const bulge = numRows > 1 ? turnBulge() : 0;
  const leftX = colX[0];
  const rightX = colX[PATH_COLS - 1];
  const topY = PATH_MARGIN_Y;
  const bottomY = PATH_MARGIN_Y + (numRows - 1) * ROW_GAP;
  const pad = BUBBLE_R + 1.5;
  const minX = leftX - pad - bulge;
  const maxX = rightX + pad + bulge;
  const minY = topY - pad;
  const maxY = bottomY + pad;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

export function buildPathLayout(sessions: TherapySessionWithNotes[]): {
  nodes: TherapySessionWithNotes[];
  points: PathPoint[];
  segments: PathSegment[];
  viewBox: string;
} {
  const nodes = sortSessionsOnPath(sessions);
  const nodeCount = nodes.length;
  const points = nodes.map((_, i) => pathIndexToPoint(i, nodeCount));

  const segments: PathSegment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const row = Math.floor(i / PATH_COLS);
    const sameRow = Math.floor((i + 1) / PATH_COLS) === row;
    const isLastHorizontalInRow =
      sameRow && (i + 1) % PATH_COLS === PATH_COLS - 1;
    const isFirstHorizontalInRow = sameRow && i % PATH_COLS === 0 && row > 0;

    const d = sameRow
      ? trimmedLine(from, to, {
          trimEnd: !isLastHorizontalInRow,
          trimStart: !isFirstHorizontalInRow,
        })
      : uTurnArc(from, to, row);
    if (!d) continue;
    segments.push({
      fromIndex: i,
      toIndex: i + 1,
      afterPathOrder: nodes[i].path_order,
      d,
      mid: segmentMidpoint(from, to, row),
    });
  }

  return { nodes, points, segments, viewBox: computeViewBox(nodeCount) };
}

export function isArcSegment(d: string): boolean {
  return d.includes(" A ") || d.includes(" C ");
}

export function trimmedSegmentD(
  fromIndex: number,
  toIndex: number,
  nodeCount: number
): string {
  const from = pathIndexToPoint(fromIndex, nodeCount);
  const to = pathIndexToPoint(toIndex, nodeCount);
  const row = Math.floor(fromIndex / PATH_COLS);
  const sameRow = Math.floor(toIndex / PATH_COLS) === row;
  if (!sameRow) return "";
  const isLastHorizontalInRow = (fromIndex + 1) % PATH_COLS === PATH_COLS - 1;
  const isFirstHorizontalInRow = fromIndex % PATH_COLS === 0 && row > 0;
  return trimmedLine(from, to, {
    trimEnd: !isLastHorizontalInRow,
    trimStart: !isFirstHorizontalInRow,
  });
}

export function bubbleLabel(session: TherapySessionWithNotes): string {
  if (session.is_special) return "N";
  return String(session.session_number);
}
