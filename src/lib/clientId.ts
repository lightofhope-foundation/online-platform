/**
 * Nutzer-ID (client_id) format: BB + II + II + SSS (9 chars, lowercase in URLs)
 * BB = batch 01–99 (999 users per batch, then batch increments)
 * II = first two letters of first name (a–z)
 * II = first two letters of surname
 * SSS = sequence 001–999 within batch
 * Example: 01angr001 → Andreas Gretzinger, first user in batch 01
 */

export function namePartTwoLetters(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-zäöüß]/gi, "")
    .slice(0, 2);
  return (normalized + "xx").slice(0, 2);
}

export function buildClientIdParts(
  batchNum: number,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  seqNum: number
): string {
  const batch = String(batchNum).padStart(2, "0");
  const seq = String(seqNum).padStart(3, "0");
  const first = namePartTwoLetters(firstName);
  const last = namePartTwoLetters(lastName);
  return `${batch}${first}${last}${seq}`.toLowerCase();
}

export function normalizeClientIdForUrl(clientId: string): string {
  return clientId.trim().toLowerCase();
}

export function isValidClientIdFormat(clientId: string): boolean {
  return /^[0-9]{2}[a-z]{4}[0-9]{3}$/i.test(clientId.trim());
}

/** German 24h display for unlock dates etc. */
export function formatGermanDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "—";
  const d = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
  const t = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  });
  return `${d} - ${t}`;
}
