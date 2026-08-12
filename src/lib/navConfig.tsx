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
  { name: "Kurse verwalten", icon: <CoursesManageIcon size={18} />, href: "/admin/videos" },
  { name: "Nutzer", icon: <UsersIcon size={18} />, href: "/admin/users" },
  { name: "Therapeuten", icon: <TherapyIcon size={18} />, href: "/admin/therapists" },
  { name: "Klientenakte", icon: <UsersIcon size={18} />, href: "/admin/lead-vault" },
  { name: "Feedback", icon: <FeedbackIcon size={18} />, href: "/admin/userfeedback" },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/admin/einstellungen" },
];

export const therapistNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/therapist" },
  { name: "Klientenakte", icon: <UsersIcon size={18} />, href: "/therapist/clients" },
  { name: "Orbit", icon: <TherapyIcon size={18} />, href: "/therapist/orbit" },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/therapist/settings" },
];

export const setterNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/setter" },
  { name: "Offene Leads", icon: <UsersIcon size={18} />, href: "/setter/users" },
  { name: "Neuer Klient", icon: <UsersIcon size={18} />, href: "/setter/users/new" },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/setter/settings" },
];

export type NavArea = "admin" | "therapist" | "setter" | "client";

export function resolveNavArea(pathname: string): NavArea {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/therapist")) return "therapist";
  if (pathname.startsWith("/setter")) return "setter";
  return "client";
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
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (area === "therapist") {
    if (href === "/therapist") return pathname === "/therapist";
    if (href === "/therapist/settings") return pathname.startsWith("/therapist/settings");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (area === "setter") {
    if (href === "/setter") return pathname === "/setter";
    if (href === "/setter/settings") return pathname.startsWith("/setter/settings");
    if (href === "/setter/users/new") return pathname === "/setter/users/new";
    if (href === "/setter/users") {
      return pathname.startsWith("/setter/users") && pathname !== "/setter/users/new";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/") return pathname === "/";
  if (href === "/courses") {
    return pathname.startsWith("/courses") || pathname.startsWith("/video");
  }
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}
