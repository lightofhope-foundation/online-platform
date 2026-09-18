import type { LeadIntakeView } from "@/lib/leadVault";

const SKIP_H1 =
  /^(august|muster|sitzungs-unterlagen|bereits|lead|template|daten|probleme|l[öo]sungen|erwartungen|value|konsequenzen|side|therapeut|\d)/i;

export type ParsedLeadVaultPerson = {
  name: string;
  firstName: string;
  lastName: string;
  intake: LeadIntakeView;
};

function isDateHeading(title: string): boolean {
  return /^\d{1,2}\.?\d{0,2}\.?$/.test(title.trim()) || /^\d{1,2}\.\d{1,2}/.test(title.trim());
}

function isPersonHeading(title: string): boolean {
  const t = title.trim();
  if (t.length < 3) return false;
  if (SKIP_H1.test(t) || isDateHeading(t)) return false;
  if (/^-/.test(t)) return false;
  // Need at least one letter and typically a space (first + last), allow hyphen names
  if (!/[A-Za-zÄÖÜäöüß]/.test(t)) return false;
  return true;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().replace(/\s+/g, " ").split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function sectionBody(md: string, headingRe: RegExp): string {
  const m = md.match(headingRe);
  if (!m || m.index == null) return "";
  const start = m.index + m[0].length;
  const rest = md.slice(start);
  const next = rest.search(/\n##\s+/);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function bulletsToText(body: string): string {
  return body
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s*/, "").trim())
    .filter((l) => l && !l.startsWith("![") && !/^#+\s/.test(l))
    .join("\n")
    .trim();
}

function parseDaten(body: string): Partial<LeadIntakeView> {
  const out: Partial<LeadIntakeView> = {};
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith("!["));

  for (const line of lines) {
    const setterEg = line.match(/^Setter\s+(.+?)\s*[|I]\s*EG\s+(.+)$/i);
    if (setterEg) {
      out.setter_name = setterEg[1].trim();
      out.closer_name = setterEg[2].trim();
      continue;
    }
    if (/@/.test(line) && !out.email) {
      out.email = line.replace(/^E-?Mail:?\s*/i, "").trim();
      continue;
    }
    if (/^(\+|00|\d{3,})/.test(line.replace(/\s/g, "")) && line.replace(/\D/g, "").length >= 8) {
      out.phone = line.replace(/^Tel(efon)?:?\s*/i, "").trim();
      continue;
    }
    const ther = line.match(/^-?\s*Therapeut:\s*(.+)$/i);
    if (ther) {
      out.therapist_name = ther[1].trim();
      continue;
    }
    const price = line.match(/^-?\s*€\s*\/?\s*Sitzung:\s*(.+)$/i) || line.match(/^-?\s*.\/\s*Sitzung:\s*(.+)$/i);
    if (price) {
      out.price_per_session = price[1].trim();
      continue;
    }
    const start = line.match(/^-?\s*Start:\s*(.+)$/i);
    if (start) {
      out.session_start = start[1].trim();
      continue;
    }
    if (/vereinbarung unterschrieben/i.test(line)) {
      out.agreement_signed = /^\s*-\s*\[[xX]\]/.test(line);
      continue;
    }
    if (/onlineplattform/i.test(line)) {
      out.platform_added = /^\s*-\s*\[[xX]\]/.test(line);
      continue;
    }
    if (/€|EUR|Raten/i.test(line) && !out.free_notes) {
      // price package note — stash in free_notes later if empty
      out.free_notes = line;
      continue;
    }
    // address: street-like or PLZ line
    if (
      !out.address &&
      (/straße|strasse|weg|platz|gasse|allee/i.test(line) || /^\d{5}\s/.test(line))
    ) {
      out.address = line;
      continue;
    }
    if (out.address && /^\d{5}\s/.test(line)) {
      out.address = `${out.address}, ${line}`;
    }
  }
  return out;
}

function parsePersonBlock(name: string, block: string): ParsedLeadVaultPerson {
  const { firstName, lastName } = splitName(name);
  const daten = parseDaten(sectionBody(block, /^##\s*Daten\b/im));
  const problems = bulletsToText(sectionBody(block, /^##\s*Probleme\b/im));
  const goals = bulletsToText(sectionBody(block, /^##\s*L[öo]sungen\s*\/\s*Ziele\b/im));
  const expectations = bulletsToText(
    sectionBody(block, /^##\s*Erwartungen\b/im)
  );
  const valueSet = bulletsToText(sectionBody(block, /^##\s*Value\s*Set\b/im));
  const consequences = bulletsToText(sectionBody(block, /^##\s*Konsequenzen\b/im));
  const sideNote = bulletsToText(sectionBody(block, /^##\s*Side\s*Note\b/im));
  const therapeutNotes = bulletsToText(sectionBody(block, /^##\s*Therapeut\b/im));

  const packageNote = daten.free_notes;
  const freeNotes = [packageNote, therapeutNotes].filter(Boolean).join("\n\n") || undefined;

  const intake: LeadIntakeView = {
    ...daten,
    free_notes: freeNotes,
    problems: problems || undefined,
    goals: goals || undefined,
    expectations: expectations || undefined,
    value_set: valueSet || undefined,
    consequences: consequences || undefined,
    side_note: sideNote || undefined,
  };

  return { name, firstName, lastName, intake };
}

/** Parse a Milanote Lead-Vault month export (e.g. August - 26-*.md). */
export function parseLeadVaultMonthMarkdown(md: string): ParsedLeadVaultPerson[] {
  const lines = md.split(/\r?\n/);
  const headings: { index: number; title: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/);
    if (!m) continue;
    const title = m[1].trim();
    if (!isPersonHeading(title)) continue;
    headings.push({ index: i, title });
  }

  const people: ParsedLeadVaultPerson[] = [];
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : lines.length;
    // Block ends at next person H1; include content until then
    const block = lines.slice(start, end).join("\n");
    // Stop intake-relevant parse at first "## Sitzung" or "# Sitzungs-Unterlagen" noise inside — handled by section extractors
    people.push(parsePersonBlock(headings[i].title, block));
  }
  return people;
}

export function normalizePersonKey(first: string, last: string): string {
  return `${first} ${last}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
