import type { TherapySessionRow } from "@/lib/therapySessions";

const STORAGE_ROOT = "Online-Plattform/sitzungsaufnahmen/therapeut";

type SessionPathBits = Pick<
  TherapySessionRow,
  "id" | "session_number" | "is_special" | "path_order"
>;

function sortByPathOrder<T extends { path_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.path_order - b.path_order);
}

function slugPart(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Folder: vorname-nachname-klientenid */
export function buildClientRecordingFolderSlug(opts: {
  firstName?: string | null;
  lastName?: string | null;
  clientId: string;
}): string {
  const first = slugPart(opts.firstName) || "klient";
  const last = slugPart(opts.lastName) || "x";
  const id = slugPart(opts.clientId) || "id";
  return `${first}-${last}-${id}`;
}

/**
 * Standard: `1-sitzung`
 * Notsitzung after Sitzung N: `1.1-notsitzung`, `1.2-notsitzung`, …
 */
export function buildSessionRecordingFileBase(
  session: SessionPathBits,
  allSessions: SessionPathBits[]
): string {
  if (!session.is_special) {
    return `${session.session_number}-sitzung`;
  }

  const ordered = sortByPathOrder(allSessions);
  const idx = ordered.findIndex((s) => s.id === session.id);
  let prevStandard = 0;
  let specialIndex = 0;
  for (let i = 0; i <= idx; i++) {
    const row = ordered[i];
    if (!row) continue;
    if (!row.is_special) {
      prevStandard = row.session_number;
      specialIndex = 0;
    } else if (i === idx) {
      specialIndex += 1;
    } else if (prevStandard > 0) {
      specialIndex += 1;
    }
  }
  const n = prevStandard > 0 ? prevStandard : 0;
  const sub = specialIndex > 0 ? specialIndex : 1;
  return `${n}.${sub}-notsitzung`;
}

export function buildSessionRecordingStoragePath(opts: {
  firstName?: string | null;
  lastName?: string | null;
  clientId: string;
  session: SessionPathBits;
  allSessions: SessionPathBits[];
  extension: string;
}): { folderSlug: string; fileBase: string; storagePath: string } {
  const folderSlug = buildClientRecordingFolderSlug(opts);
  const fileBase = buildSessionRecordingFileBase(opts.session, opts.allSessions);
  const ext = opts.extension.replace(/^\./, "").toLowerCase() || "mp4";
  const storagePath = `${STORAGE_ROOT}/${folderSlug}/${fileBase}.${ext}`;
  return { folderSlug, fileBase, storagePath };
}

export function isStorageRecordingRef(ref: string | null | undefined): boolean {
  if (!ref) return false;
  const t = ref.trim();
  return (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.includes("/") ||
    t.startsWith("storage:")
  );
}

export function resolveRecordingPublicUrl(ref: string): string {
  const t = ref.trim();
  if (t.startsWith("storage:")) return t.slice("storage:".length);
  return t;
}
