/** Clock-style timestamp without unit suffix (e.g. 06:21, 1:06:21). */
export function formatPlaybackTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }
  return `${String(minutes).padStart(2, "0")}:${ss}`;
}

export function estimateTotalDurationSeconds(
  lastSecond: number,
  percent: number,
  durationSeconds?: number | null
): number | null {
  if (durationSeconds != null && durationSeconds > 0) {
    return durationSeconds;
  }
  if (percent > 0 && lastSecond >= 0) {
    return Math.round(lastSecond / (percent / 100));
  }
  return null;
}

export function getRemainingSeconds(
  lastSecond: number,
  percent: number,
  durationSeconds?: number | null
): number | null {
  const total = estimateTotalDurationSeconds(lastSecond, percent, durationSeconds);
  if (total == null) return null;
  return Math.max(0, Math.round(total - lastSecond));
}
