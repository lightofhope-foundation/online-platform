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
};

export const clientNavItems: NavItem[] = [
  { name: "Startseite", icon: <HomeIcon size={18} />, href: "/" },
  { name: "Video-Section", icon: <VideosIcon size={18} />, href: "/courses" },
  { name: "Sitzungsaufnahmen", icon: <RecordingsIcon size={18} />, href: "#" },
  { name: "Selbstcheck", icon: <SelbstcheckIcon size={18} />, href: "#" },
  { name: "Feedback", icon: <FeedbackIcon size={18} />, href: "#" },
  { name: "1:1 Therapie", icon: <TherapyIcon size={18} />, href: "#" },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/settings" },
];

export const adminNavItems: NavItem[] = [
  { name: "Überblick", icon: <OverviewIcon size={18} />, href: "/admin" },
  { name: "Kurse verwalten", icon: <CoursesManageIcon size={18} />, href: "/admin/videos" },
  { name: "Nutzer", icon: <UsersIcon size={18} />, href: "/admin/users" },
  { name: "Feedback", icon: <FeedbackIcon size={18} />, href: "/admin/userfeedback" },
  { name: "Einstellungen", icon: <SettingsIcon size={18} />, href: "/admin/einstellungen" },
];

export function isNavItemActive(
  pathname: string,
  href: string,
  isAdminRoute: boolean
): boolean {
  if (href === "#") return false;

  if (isAdminRoute) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === "/") return pathname === "/";
  if (href === "/courses") {
    return pathname.startsWith("/courses") || pathname.startsWith("/video");
  }
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}
