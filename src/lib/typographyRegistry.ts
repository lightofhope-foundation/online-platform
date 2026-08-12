import type { FontId } from "@/lib/platformFonts";

export type AppRole = "client" | "admin" | "therapist" | "setter" | "public";

export type TypographyUsage = {
  role: AppRole;
  path: string;
  pageLabel: string;
};

export type TypographyToken = {
  id: string;
  /** CSS class applied in components, e.g. typo-clients-heading */
  className: string;
  /** Short label in admin UI */
  label: string;
  /** Description in parentheses */
  description: string;
  /** Always shown in settings (cannot remove) */
  core?: boolean;
  defaultFont: FontId;
  defaultSizePx: number;
  sizeMin: number;
  sizeMax: number;
  usages: TypographyUsage[];
};

/**
 * Catalog of controllable typography classes.
 * When adding a token: register here AND apply `className` in the components listed under usages.
 */
export const TYPOGRAPHY_REGISTRY: TypographyToken[] = [
  {
    id: "greeting",
    className: "typo-greeting",
    label: "greeting",
    description: 'Große Begrüßung „Hallo …“',
    core: true,
    defaultFont: "chalkboy",
    defaultSizePx: 30,
    sizeMin: 18,
    sizeMax: 64,
    usages: [
      { role: "client", path: "/", pageLabel: "Startseite" },
      { role: "admin", path: "/admin", pageLabel: "Admin-Überblick" },
    ],
  },
  {
    id: "section",
    className: "typo-section",
    label: "section",
    description: "Abschnitt-Titel (Gesamtfortschritt, Bereiche, …)",
    core: true,
    defaultFont: "doublefinger",
    defaultSizePx: 20,
    sizeMin: 14,
    sizeMax: 40,
    usages: [
      { role: "client", path: "/", pageLabel: "Startseite" },
      { role: "admin", path: "/admin", pageLabel: "Admin-Überblick" },
      { role: "therapist", path: "/therapist", pageLabel: "Therapeut-Überblick" },
      { role: "setter", path: "/setter", pageLabel: "Setter-Home" },
    ],
  },
  {
    id: "body",
    className: "typo-body",
    label: "body",
    description: "Fließtext & allgemeine UI",
    core: true,
    defaultFont: "rns-sanz",
    defaultSizePx: 16,
    sizeMin: 12,
    sizeMax: 22,
    usages: [
      { role: "client", path: "/*", pageLabel: "Gesamte Client-App" },
      { role: "admin", path: "/admin/*", pageLabel: "Gesamter Admin-Bereich" },
      { role: "therapist", path: "/therapist/*", pageLabel: "Gesamter Therapeut-Bereich" },
      { role: "setter", path: "/setter/*", pageLabel: "Gesamter Setter-Bereich" },
    ],
  },
  {
    id: "menu",
    className: "typo-menu",
    label: "menu",
    description: "Sidebar- & Mobile-Navigation",
    core: true,
    defaultFont: "rns-sanz",
    defaultSizePx: 15,
    sizeMin: 12,
    sizeMax: 22,
    usages: [
      { role: "client", path: "/*", pageLabel: "Sidebar / MobileNav" },
      { role: "admin", path: "/admin/*", pageLabel: "Sidebar" },
      { role: "therapist", path: "/therapist/*", pageLabel: "Sidebar / MobileNav" },
      { role: "setter", path: "/setter/*", pageLabel: "Sidebar" },
    ],
  },
  {
    id: "clients-heading",
    className: "typo-clients-heading",
    label: "clients-heading",
    description: 'Überschr. „Meine Klient:innen“',
    defaultFont: "libre-baskerville",
    defaultSizePx: 36,
    sizeMin: 20,
    sizeMax: 56,
    usages: [
      {
        role: "therapist",
        path: "/therapist/clients",
        pageLabel: "Klientenakte (Board)",
      },
      {
        role: "therapist",
        path: "/therapist",
        pageLabel: "Überblick (Liste-Titel)",
      },
    ],
  },
  {
    id: "page-title",
    className: "typo-page-title",
    label: "page-title",
    description: "Seiten-Titel (Einstellungen, Listen, …)",
    defaultFont: "rns-sanz",
    defaultSizePx: 24,
    sizeMin: 16,
    sizeMax: 40,
    usages: [
      { role: "client", path: "/settings", pageLabel: "Einstellungen" },
      { role: "client", path: "/sitzungsaufnahmen", pageLabel: "Sitzungsaufnahmen" },
      { role: "admin", path: "/admin/einstellungen", pageLabel: "Admin-Einstellungen" },
      { role: "admin", path: "/admin/users", pageLabel: "Nutzer" },
      { role: "admin", path: "/admin/therapists", pageLabel: "Therapeuten" },
      { role: "admin", path: "/admin/videos", pageLabel: "Videos & Kurse" },
      { role: "therapist", path: "/therapist/settings", pageLabel: "Einstellungen" },
      { role: "setter", path: "/setter/settings", pageLabel: "Einstellungen" },
      { role: "setter", path: "/setter/users", pageLabel: "Offene Leads" },
      { role: "public", path: "/login", pageLabel: "Login" },
    ],
  },
  {
    id: "person-name",
    className: "typo-person-name",
    label: "person-name",
    description: "Großer Name auf Akte / Lead-Detail",
    defaultFont: "libre-baskerville",
    defaultSizePx: 36,
    sizeMin: 20,
    sizeMax: 56,
    usages: [
      { role: "admin", path: "/admin/lead-vault/*", pageLabel: "Lead-Detail" },
      { role: "therapist", path: "/therapist/clients/[slug]", pageLabel: "Klienten-Detail" },
      { role: "setter", path: "/setter/users/[slug]", pageLabel: "Lead-Akte" },
    ],
  },
  {
    id: "board-title",
    className: "typo-board-title",
    label: "board-title",
    description: "Titel eines Schachtel-/Vault-Boards",
    defaultFont: "libre-baskerville",
    defaultSizePx: 36,
    sizeMin: 20,
    sizeMax: 56,
    usages: [
      { role: "admin", path: "/admin/lead-vault/[boardId]", pageLabel: "Lead Vault Board" },
      { role: "therapist", path: "/therapist/lead-vault/[boardId]", pageLabel: "Lead Vault Board" },
    ],
  },
  {
    id: "session-hero",
    className: "typo-session-hero",
    label: "session-hero",
    description: "Sitzungspfad-Hero-Titel",
    defaultFont: "libre-baskerville",
    defaultSizePx: 32,
    sizeMin: 18,
    sizeMax: 48,
    usages: [
      {
        role: "admin",
        path: "/admin/users/[slug]/sitzungen",
        pageLabel: "Sitzungsakte",
      },
      {
        role: "therapist",
        path: "/therapist/clients/[slug]/sitzungen",
        pageLabel: "Sitzungsakte",
      },
      { role: "client", path: "/sitzungen", pageLabel: "Sitzungen" },
    ],
  },
  {
    id: "course-title",
    className: "typo-course-title",
    label: "course-title",
    description: "Kurs-Titel in der Video-Section",
    defaultFont: "rns-sanz",
    defaultSizePx: 36,
    sizeMin: 20,
    sizeMax: 56,
    usages: [
      { role: "client", path: "/courses/[slug]", pageLabel: "Kurs-Detail" },
    ],
  },
  {
    id: "topbar-title",
    className: "typo-topbar-title",
    label: "topbar-title",
    description: "Optionaler Titel in der TopBar",
    defaultFont: "rns-sanz",
    defaultSizePx: 20,
    sizeMin: 14,
    sizeMax: 32,
    usages: [
      { role: "client", path: "/*", pageLabel: "TopBar (wenn gesetzt)" },
      { role: "admin", path: "/admin/*", pageLabel: "TopBar (wenn gesetzt)" },
      { role: "therapist", path: "/therapist/*", pageLabel: "TopBar (wenn gesetzt)" },
      { role: "setter", path: "/setter/*", pageLabel: "TopBar (wenn gesetzt)" },
    ],
  },
];

export const TYPOGRAPHY_BY_ID = Object.fromEntries(
  TYPOGRAPHY_REGISTRY.map((t) => [t.id, t])
) as Record<string, TypographyToken>;

export const CORE_TOKEN_IDS = TYPOGRAPHY_REGISTRY.filter((t) => t.core).map(
  (t) => t.id
);

export type TokenStyle = {
  font: FontId;
  sizePx: number;
};

export type TypographyConfig = {
  pinned: string[];
  styles: Record<string, TokenStyle>;
};

export function defaultTokenStyle(token: TypographyToken): TokenStyle {
  return { font: token.defaultFont, sizePx: token.defaultSizePx };
}

export function buildDefaultTypographyConfig(): TypographyConfig {
  const styles: Record<string, TokenStyle> = {};
  for (const t of TYPOGRAPHY_REGISTRY) {
    styles[t.id] = defaultTokenStyle(t);
  }
  return { pinned: [...CORE_TOKEN_IDS], styles };
}

export function usageCount(token: TypographyToken): number {
  return token.usages.length;
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "client":
      return "Klient";
    case "admin":
      return "Admin";
    case "therapist":
      return "Therapeut";
    case "setter":
      return "Setter";
    case "public":
      return "Öffentlich";
  }
}
