/** File size: MB rounded whole; from 1000 MB use GB with 2 decimals. */
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0 || !Number.isFinite(bytes)) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

/** Duration: mm:ss up to 59:59; above that 1h XX min. */
export function formatVideoDuration(totalSeconds: number | null | undefined): string | null {
  if (totalSeconds == null || totalSeconds <= 0 || !Number.isFinite(totalSeconds)) {
    return null;
  }
  const s = Math.floor(totalSeconds);
  if (s <= 59 * 60 + 59) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m} min`;
}

export function formatVideoMetaLine(
  sizeBytes: number | null | undefined,
  durationSeconds: number | null | undefined
): string {
  const parts: string[] = [];
  const size = formatFileSize(sizeBytes);
  const dur = formatVideoDuration(durationSeconds);
  if (size) parts.push(size);
  if (dur) parts.push(dur);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
