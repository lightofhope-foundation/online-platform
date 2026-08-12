/** Brand + catalog fonts for platform typography */

export type FontId =
  | "chalkboy"
  | "doublefinger"
  | "rns-sanz"
  | "robgraves"
  | "geist"
  | "geist-mono"
  | "system"
  | "outfit"
  | "dm-sans"
  | "space-grotesk"
  | "manrope"
  | "fraunces"
  | "source-serif"
  | "libre-baskerville";

export type FontCategory = "headline" | "section" | "body" | "menu";

export type PlatformFontSettings = {
  headline: FontId;
  section: FontId;
  body: FontId;
  menu: FontId;
  headlineSizePx: number;
  sectionSizePx: number;
  bodySizePx: number;
  menuSizePx: number;
};

export const DEFAULT_FONT_SETTINGS: PlatformFontSettings = {
  headline: "chalkboy",
  section: "doublefinger",
  body: "rns-sanz",
  menu: "rns-sanz",
  headlineSizePx: 30,
  sectionSizePx: 20,
  bodySizePx: 16,
  menuSizePx: 15,
};

export const FONT_SIZE_BOUNDS: Record<
  FontCategory,
  { min: number; max: number; step: number }
> = {
  headline: { min: 18, max: 64, step: 1 },
  section: { min: 14, max: 40, step: 1 },
  body: { min: 12, max: 22, step: 1 },
  menu: { min: 12, max: 22, step: 1 },
};

export type FontOption = {
  id: FontId;
  label: string;
  group: "loh" | "default";
  stack: string;
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "chalkboy",
    label: "Chalkboy",
    group: "loh",
    stack: "var(--font-chalkboy), sans-serif",
  },
  {
    id: "doublefinger",
    label: "Doublefinger Fun",
    group: "loh",
    stack: "var(--font-doublefinger), sans-serif",
  },
  {
    id: "rns-sanz",
    label: "RNS Sanz",
    group: "loh",
    stack: "var(--font-rns-sanz), sans-serif",
  },
  {
    id: "robgraves",
    label: "Robgraves",
    group: "loh",
    stack: "var(--font-robgraves), sans-serif",
  },
  {
    id: "geist",
    label: "Geist Sans",
    group: "default",
    stack: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "geist-mono",
    label: "Geist Mono",
    group: "default",
    stack: "var(--font-geist-mono), ui-monospace, monospace",
  },
  {
    id: "outfit",
    label: "Outfit",
    group: "default",
    stack: "var(--font-outfit), sans-serif",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    group: "default",
    stack: "var(--font-dm-sans), sans-serif",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    group: "default",
    stack: "var(--font-space-grotesk), sans-serif",
  },
  {
    id: "manrope",
    label: "Manrope",
    group: "default",
    stack: "var(--font-manrope), sans-serif",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    group: "default",
    stack: "var(--font-fraunces), serif",
  },
  {
    id: "source-serif",
    label: "Source Serif 4",
    group: "default",
    stack: "var(--font-source-serif), serif",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    group: "default",
    stack: "var(--font-libre-baskerville), serif",
  },
  {
    id: "system",
    label: "System UI",
    group: "default",
    stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
];

export const FONT_OPTION_BY_ID = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.id, f])
) as Record<FontId, FontOption>;

export const FONT_CATEGORIES: {
  key: FontCategory;
  label: string;
  description: string;
  previewSample: string;
  previewClass: string;
  sizeKey: keyof PlatformFontSettings;
}[] = [
  {
    key: "headline",
    label: "Große Überschriften",
    description: "z. B. „Hallo Teo“ auf der Startseite",
    previewSample: "Hallo Teo",
    previewClass: "text-[#63eca9]",
    sizeKey: "headlineSizePx",
  },
  {
    key: "section",
    label: "Abschnitt-Titel",
    description: "z. B. „Gesamtfortschritt“, „Weiter schauen“",
    previewSample: "Gesamtfortschritt",
    previewClass: "text-white",
    sizeKey: "sectionSizePx",
  },
  {
    key: "body",
    label: "Fließtext & UI",
    description: "Absätze, Buttons, Tabellen, Kacheln",
    previewSample: "1 von 118 Videos abgeschlossen",
    previewClass: "text-white/80",
    sizeKey: "bodySizePx",
  },
  {
    key: "menu",
    label: "Menü (Sidebar)",
    description: "Navigationspunkte in der linken Leiste",
    previewSample: "Startseite · Video-Section · Einstellungen",
    previewClass: "text-white/90",
    sizeKey: "menuSizePx",
  },
];

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && value in FONT_OPTION_BY_ID;
}

function clampSize(category: FontCategory, value: number): number {
  const { min, max } = FONT_SIZE_BOUNDS[category];
  if (!Number.isFinite(value)) return DEFAULT_FONT_SETTINGS[`${category}SizePx` as const];
  return Math.min(max, Math.max(min, Math.round(value)));
}

function pickSize(
  raw: unknown,
  category: FontCategory,
  fallback: number
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return clampSize(category, n);
}

export function normalizeFontSettings(
  raw: Partial<Record<string, unknown>> | null | undefined
): PlatformFontSettings {
  const pick = (key: string, fallback: FontId): FontId => {
    const v = raw?.[key];
    return isFontId(v) ? v : fallback;
  };
  return {
    headline: pick("headline", DEFAULT_FONT_SETTINGS.headline),
    section: pick("section", DEFAULT_FONT_SETTINGS.section),
    body: pick("body", DEFAULT_FONT_SETTINGS.body),
    menu: pick("menu", DEFAULT_FONT_SETTINGS.menu),
    headlineSizePx: pickSize(
      raw?.headlineSizePx,
      "headline",
      DEFAULT_FONT_SETTINGS.headlineSizePx
    ),
    sectionSizePx: pickSize(
      raw?.sectionSizePx,
      "section",
      DEFAULT_FONT_SETTINGS.sectionSizePx
    ),
    bodySizePx: pickSize(
      raw?.bodySizePx,
      "body",
      DEFAULT_FONT_SETTINGS.bodySizePx
    ),
    menuSizePx: pickSize(
      raw?.menuSizePx,
      "menu",
      DEFAULT_FONT_SETTINGS.menuSizePx
    ),
  };
}

export function fontStack(id: FontId): string {
  return FONT_OPTION_BY_ID[id]?.stack ?? FONT_OPTION_BY_ID.geist.stack;
}

/** Apply CSS custom properties used by globals.css / loh-fonts.css */
export function applyFontSettingsToDocument(settings: PlatformFontSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-loh-headline", fontStack(settings.headline));
  root.style.setProperty("--font-loh-section", fontStack(settings.section));
  root.style.setProperty("--font-loh-body", fontStack(settings.body));
  root.style.setProperty("--font-loh-menu", fontStack(settings.menu));
  root.style.setProperty(
    "--font-loh-headline-size",
    `${settings.headlineSizePx}px`
  );
  root.style.setProperty(
    "--font-loh-section-size",
    `${settings.sectionSizePx}px`
  );
  root.style.setProperty("--font-loh-body-size", `${settings.bodySizePx}px`);
  root.style.setProperty("--font-loh-menu-size", `${settings.menuSizePx}px`);
}

export function rowToFontSettings(row: {
  headline_font?: string | null;
  section_font?: string | null;
  body_font?: string | null;
  menu_font?: string | null;
  headline_size_px?: number | string | null;
  section_size_px?: number | string | null;
  body_size_px?: number | string | null;
  menu_size_px?: number | string | null;
} | null): PlatformFontSettings {
  return normalizeFontSettings({
    headline: row?.headline_font,
    section: row?.section_font,
    body: row?.body_font,
    menu: row?.menu_font,
    headlineSizePx: row?.headline_size_px,
    sectionSizePx: row?.section_size_px,
    bodySizePx: row?.body_size_px,
    menuSizePx: row?.menu_size_px,
  });
}

export function sizeKeyForCategory(
  category: FontCategory
): keyof PlatformFontSettings {
  return FONT_CATEGORIES.find((c) => c.key === category)!.sizeKey;
}
