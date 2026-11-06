"use client";

import type { ReactNode } from "react";
import {
  HomeIcon,
  VideosIcon,
  RecordingsIcon,
  SelbstcheckIcon,
  FeedbackIcon,
  TherapyIcon,
  SettingsIcon,
  OverviewIcon,
  CoursesManageIcon,
  UsersIcon,
} from "@/components/icons/Icons";
import { SOFT_RELEASE } from "@/lib/softRelease";

export type NavItem = {
  name: string;
  href: string;
  icon: ReactNode;
  /** Hidden in sidebar but kept for later re-enable */
  hidden?: boolean;
};

export const clientNavItems: NavItem[] = [
  { name: "Startseite", icon: <HomeIcon size={18} />, href: "/" },
  { name: "Video-Section", icon: <VideosIcon size={18} />, href: "/courses" },
  {
    name: "Sitzungsaufnahmen",
    icon: <RecordingsIcon size={18} />,
    href: "/sitzungsaufnahmen",
  },
  {
    name: "Selbstcheck",
    icon: <SelbstcheckIcon size={18} />,
    href: "/selbstcheck",
    hidden: true,
  },
  { name: "Sitzungen", icon: <TherapyIcon size={18} />, href: "/sitzungen" },
  {
    name: "1:1 Therapie",
    icon: <TherapyIcon size={18} />,
    href: "/therapie",
    hidden: true,
  },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/settings" },
];

export const adminNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/admin" },
  { name: "Klienten", icon: <UsersIcon size={18} />, href: "/admin/clients" },
  { name: "Leads", icon: <UsersIcon size={18} />, href: "/admin/leads" },
  {
    name: "Meine Klienten",
    icon: <TherapyIcon size={18} />,
    href: "/admin/my-clients",
  },
  {
    name: "Notion Leadboard",
    icon: <UsersIcon size={18} />,
    href: "/setter/leadboard",
    hidden: !SOFT_RELEASE.notionLeadboard,
  },
  {
    name: "Offene Leads",
    icon: <UsersIcon size={18} />,
    href: "/setter/users",
    hidden: !SOFT_RELEASE.notionOpenLeads,
  },
  { name: "Nutzerverwaltung", icon: <UsersIcon size={18} />, href: "/admin/users" },
  { name: "Therapeuten", icon: <TherapyIcon size={18} />, href: "/admin/therapists" },
  {
    name: "Klientenakte",
    icon: <UsersIcon size={18} />,
    href: "/admin/lead-vault",
    hidden: !SOFT_RELEASE.leadVaultNav,
  },
  { name: "Kurse verwalten", icon: <CoursesManageIcon size={18} />, href: "/admin/videos" },
  {
    name: "Feedback",
    icon: <FeedbackIcon size={18} />,
    href: "/admin/userfeedback",
    hidden: !SOFT_RELEASE.feedbackNav,
  },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/admin/einstellungen" },
];

export const therapistNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/therapist" },
  { name: "Klienten", icon: <UsersIcon size={18} />, href: "/therapist/all-clients" },
  { name: "Leads", icon: <UsersIcon size={18} />, href: "/therapist/leads" },
  {
    name: "Meine Klienten",
    icon: <TherapyIcon size={18} />,
    href: "/therapist/clients",
  },
  {
    name: "Orbit",
    icon: <TherapyIcon size={18} />,
    href: "/therapist/orbit",
    hidden: !SOFT_RELEASE.orbitNav,
  },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/therapist/settings" },
];

export const setterNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/setter" },
  { name: "Klienten", icon: <UsersIcon size={18} />, href: "/setter/clients" },
  { name: "Leads", icon: <UsersIcon size={18} />, href: "/setter/leads" },
  {
    name: "Notion Leadboard",
    icon: <UsersIcon size={18} />,
    href: "/setter/leadboard",
    hidden: !SOFT_RELEASE.notionLeadboard,
  },
  {
    name: "Offene Leads",
    icon: <UsersIcon size={18} />,
    href: "/setter/users",
    hidden: !SOFT_RELEASE.notionOpenLeads,
  },
  {
    name: "Neuer Lead",
    icon: <UsersIcon size={18} />,
    href: "/setter/leads/new",
  },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/setter/settings" },
];

/** Erstgesprächler: keine Setter-Querverweise, nur zugewiesene Leads */
export const erstgespraechlerNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/setter/eg" },
  {
    name: "Zugewiesene Leads",
    icon: <UsersIcon size={18} />,
    href: "/setter/eg",
  },
  {
    name: "Klienten",
    icon: <UsersIcon size={18} />,
    href: "/setter/eg/clients",
  },
  {
    name: "Einstellungen",
    icon: <SettingsIcon size={18} />,
    href: "/setter/settings?view=eg",
  },
];

export const teamleadNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/teamlead" },
  { name: "Klienten", icon: <UsersIcon size={18} />, href: "/teamlead/clients" },
  { name: "Leads", icon: <UsersIcon size={18} />, href: "/teamlead/leads" },
  {
    name: "Meine Klienten",
    icon: <TherapyIcon size={18} />,
    href: "/teamlead/my-clients",
  },
  {
    name: "Notion Leadboard",
    icon: <UsersIcon size={18} />,
    href: "/setter/leadboard",
    hidden: !SOFT_RELEASE.notionLeadboard,
  },
  {
    name: "Setter-Bereich",
    icon: <UsersIcon size={18} />,
    href: "/setter",
    hidden: true,
  },
];

export type NavArea = "admin" | "therapist" | "setter" | "teamlead" | "client";

export function resolveNavArea(pathname: string): NavArea {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/therapist")) return "therapist";
  if (pathname.startsWith("/teamlead")) return "teamlead";
  if (pathname.startsWith("/setter")) return "setter";
  return "client";
}

export function isErstgespraechlerPath(
  pathname: string,
  search?: string
): boolean {
  if (pathname === "/setter/eg" || pathname.startsWith("/setter/eg/")) return true;
  if (!search) return false;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return params.get("view") === "eg";
}

export function visibleNavItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.hidden);
}

export function isNavItemActive(
  pathname: string,
  href: string,
  area: NavArea
): boolean {
  if (href === "#") return false;

  if (area === "admin") {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/setter/leadboard") return pathname.startsWith("/setter/leadboard");
    if (href === "/setter/users") {
      return (
        pathname.startsWith("/setter/users") && pathname !== "/setter/users/new"
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (area === "therapist") {
    if (href === "/therapist") return pathname === "/therapist";
    if (href === "/therapist/settings") return pathname.startsWith("/therapist/settings");
    if (href === "/therapist/clients") {
      return (
        pathname.startsWith("/therapist/clients") &&
        !pathname.startsWith("/therapist/all-clients")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (area === "setter") {
    if (href === "/setter") return pathname === "/setter";
    if (href === "/setter/settings") return pathname.startsWith("/setter/settings");
    if (href === "/setter/leadboard") return pathname.startsWith("/setter/leadboard");
    if (href === "/setter/leads/new") return pathname === "/setter/leads/new";
    if (href === "/setter/leads") {
      return pathname.startsWith("/setter/leads") && pathname !== "/setter/leads/new";
    }
    if (href === "/setter/users") {
      return pathname.startsWith("/setter/users") && pathname !== "/setter/users/new";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (area === "teamlead") {
    if (href === "/teamlead") return pathname === "/teamlead";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/") return pathname === "/";
  if (href === "/courses") {
    return pathname.startsWith("/courses") || pathname.startsWith("/video");
  }
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}
