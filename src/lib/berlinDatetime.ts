const BERLIN_TZ = "Europe/Berlin";

/** Value for `<input type="datetime-local">` in Europe/Berlin. */
export function isoToBerlinDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parse datetime-local string as Europe/Berlin wall time → ISO UTC.
 * Accepts `YYYY-MM-DDTHH:mm` from browser input.
 */
export function berlinDatetimeLocalToIso(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const [, y, mo, d, h, mi] = match;
  const utcGuess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const offsetPart = formatter.formatToParts(new Date(utcGuess)).find((p) => p.type === "timeZoneName");
  const offsetStr = offsetPart?.value ?? "GMT+1";
  const offsetMatch = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(offsetStr);
  let offsetMinutes = 60;
  if (offsetMatch) {
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const hours = Number(offsetMatch[2]);
    const mins = Number(offsetMatch[3] ?? 0);
    offsetMinutes = sign * (hours * 60 + mins);
  }

  const utcMs = utcGuess - offsetMinutes * 60 * 1000;
  return new Date(utcMs).toISOString();
}
