import {
  FONT_OPTION_BY_ID,
  fontStack,
  isFontId,
  type FontId,
} from "@/lib/platformFonts";
import {
  CORE_TOKEN_IDS,
  TYPOGRAPHY_BY_ID,
  TYPOGRAPHY_REGISTRY,
  buildDefaultTypographyConfig,
  defaultTokenStyle,
  type TokenStyle,
  type TypographyConfig,
} from "@/lib/typographyRegistry";

export type {
  FontId,
  FontOption,
} from "@/lib/platformFonts";
export { FONT_OPTIONS, fontStack, isFontId } from "@/lib/platformFonts";
export {
  TYPOGRAPHY_REGISTRY,
  TYPOGRAPHY_BY_ID,
  CORE_TOKEN_IDS,
  usageCount,
  roleLabel,
  type TypographyToken,
  type TypographyUsage,
  type TypographyConfig,
  type TokenStyle,
} from "@/lib/typographyRegistry";

function clampTokenSize(tokenId: string, sizePx: number): number {
  const token = TYPOGRAPHY_BY_ID[tokenId];
  if (!token) return Math.round(sizePx);
  return Math.min(
    token.sizeMax,
    Math.max(token.sizeMin, Math.round(sizePx))
  );
}

function normalizeStyle(raw: unknown, tokenId: string): TokenStyle {
  const token = TYPOGRAPHY_BY_ID[tokenId];
  const fallback = token ? defaultTokenStyle(token) : { font: "geist" as FontId, sizePx: 16 };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const font = isFontId(obj.font) ? obj.font : fallback.font;
  const sizePx = clampTokenSize(
    tokenId,
    typeof obj.sizePx === "number" ? obj.sizePx : Number(obj.sizePx)
  );
  return {
    font,
    sizePx: Number.isFinite(sizePx) ? sizePx : fallback.sizePx,
  };
}

export function normalizeTypographyConfig(
  raw: {
    pinned_tokens?: string[] | null;
    token_styles?: Record<string, unknown> | null;
    // legacy columns
    headline_font?: string | null;
    section_font?: string | null;
    body_font?: string | null;
    menu_font?: string | null;
    headline_size_px?: number | string | null;
    section_size_px?: number | string | null;
    body_size_px?: number | string | null;
    menu_size_px?: number | string | null;
  } | null
): TypographyConfig {
  const base = buildDefaultTypographyConfig();
  const styles: Record<string, TokenStyle> = { ...base.styles };

  // Legacy columns → greeting/section/body/menu
  if (raw?.headline_font || raw?.headline_size_px != null) {
    styles.greeting = normalizeStyle(
      {
        font: raw.headline_font,
        sizePx: raw.headline_size_px,
      },
      "greeting"
    );
  }
  if (raw?.section_font || raw?.section_size_px != null) {
    styles.section = normalizeStyle(
      {
        font: raw.section_font,
        sizePx: raw.section_size_px,
      },
      "section"
    );
  }
  if (raw?.body_font || raw?.body_size_px != null) {
    styles.body = normalizeStyle(
      { font: raw.body_font, sizePx: raw.body_size_px },
      "body"
    );
  }
  if (raw?.menu_font || raw?.menu_size_px != null) {
    styles.menu = normalizeStyle(
      { font: raw.menu_font, sizePx: raw.menu_size_px },
      "menu"
    );
  }

  if (raw?.token_styles && typeof raw.token_styles === "object") {
    for (const [id, value] of Object.entries(raw.token_styles)) {
      if (!TYPOGRAPHY_BY_ID[id]) continue;
      styles[id] = normalizeStyle(value, id);
    }
  }

  const pinnedRaw = Array.isArray(raw?.pinned_tokens)
    ? raw!.pinned_tokens!.filter((id) => !!TYPOGRAPHY_BY_ID[id])
    : [...CORE_TOKEN_IDS];

  const pinned = [
    ...CORE_TOKEN_IDS,
    ...pinnedRaw.filter((id) => !CORE_TOKEN_IDS.includes(id)),
  ];

  return { pinned, styles };
}

export function applyTypographyConfig(config: TypographyConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  for (const token of TYPOGRAPHY_REGISTRY) {
    const style = config.styles[token.id] ?? defaultTokenStyle(token);
    root.style.setProperty(`--typo-${token.id}-font`, fontStack(style.font));
    root.style.setProperty(`--typo-${token.id}-size`, `${style.sizePx}px`);
  }

  // Legacy aliases used by older class names
  const greeting = config.styles.greeting ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.greeting);
  const section = config.styles.section ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.section);
  const body = config.styles.body ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.body);
  const menu = config.styles.menu ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.menu);

  root.style.setProperty("--font-loh-headline", fontStack(greeting.font));
  root.style.setProperty("--font-loh-section", fontStack(section.font));
  root.style.setProperty("--font-loh-body", fontStack(body.font));
  root.style.setProperty("--font-loh-menu", fontStack(menu.font));
  root.style.setProperty("--font-loh-headline-size", `${greeting.sizePx}px`);
  root.style.setProperty("--font-loh-section-size", `${section.sizePx}px`);
  root.style.setProperty("--font-loh-body-size", `${body.sizePx}px`);
  root.style.setProperty("--font-loh-menu-size", `${menu.sizePx}px`);
}

export function configToDbPatch(config: TypographyConfig) {
  const greeting = config.styles.greeting ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.greeting);
  const section = config.styles.section ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.section);
  const body = config.styles.body ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.body);
  const menu = config.styles.menu ?? defaultTokenStyle(TYPOGRAPHY_BY_ID.menu);

  return {
    pinned_tokens: config.pinned,
    token_styles: config.styles,
    headline_font: greeting.font,
    section_font: section.font,
    body_font: body.font,
    menu_font: menu.font,
    headline_size_px: greeting.sizePx,
    section_size_px: section.sizePx,
    body_size_px: body.sizePx,
    menu_size_px: menu.sizePx,
  };
}

export function getTokenStyle(
  config: TypographyConfig,
  tokenId: string
): TokenStyle {
  const token = TYPOGRAPHY_BY_ID[tokenId];
  if (!token) return { font: "geist", sizePx: 16 };
  return config.styles[tokenId] ?? defaultTokenStyle(token);
}

export function fontLabel(id: FontId): string {
  return FONT_OPTION_BY_ID[id]?.label ?? id;
}
