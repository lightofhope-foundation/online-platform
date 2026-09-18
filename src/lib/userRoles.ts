import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { UserRole } from "@/lib/profileRole";

/** Portal roles per Dincer-Konzept (Mehrfachrollen möglich). */
export type PortalRole =
  | "admin"
  | "therapist"
  | "setter"
  | "erstgespraechler"
  | "setter_closer"
  | "teamlead"
  | "client";

const PORTAL_ROLES: PortalRole[] = [
  "admin",
  "therapist",
  "setter",
  "erstgespraechler",
  "setter_closer",
  "teamlead",
  "client",
];

function normalizeRole(role: string | null | undefined): PortalRole | null {
  if (!role) return null;
  if (role === "patient") return "client";
  if (PORTAL_ROLES.includes(role as PortalRole)) return role as PortalRole;
  return null;
}

export async function getUserPortalRoles(userId: string): Promise<PortalRole[]> {
  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: extras } = await supabase
    .from("profile_extra_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = new Set<PortalRole>();
  const primary = normalizeRole(profile?.role);
  if (primary) roles.add(primary);
  (extras ?? []).forEach((row) => {
    const r = normalizeRole(row.role);
    if (r) roles.add(r);
  });

  // Legacy: setter_closer zählt als Setter + Erstgesprächler
  if (roles.has("setter_closer")) {
    roles.add("setter");
    roles.add("erstgespraechler");
  }

  return [...roles];
}

export function userHasPortalRole(roles: PortalRole[], role: PortalRole): boolean {
  if (roles.includes(role)) return true;
  if (
    (role === "setter" || role === "erstgespraechler") &&
    roles.includes("setter_closer")
  ) {
    return true;
  }
  return false;
}

export function userHasSalesAccess(roles: PortalRole[]): boolean {
  return (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "setter_closer")
  );
}

export async function userHasPortalRoleById(
  userId: string,
  role: PortalRole
): Promise<boolean> {
  const roles = await getUserPortalRoles(userId);
  return userHasPortalRole(roles, role);
}

export type RoleViewOption = {
  id: PortalRole;
  label: string;
  href: string;
};

export function resolveRoleViewOptions(roles: PortalRole[]): RoleViewOption[] {
  const options: RoleViewOption[] = [];
  if (userHasPortalRole(roles, "admin")) {
    options.push({ id: "admin", label: "Admin", href: "/admin" });
  }
  if (userHasPortalRole(roles, "teamlead")) {
    options.push({ id: "teamlead", label: "Teamleitung", href: "/teamlead" });
  }
  if (userHasPortalRole(roles, "therapist")) {
    options.push({ id: "therapist", label: "Therapeut", href: "/therapist" });
  }
  if (userHasPortalRole(roles, "setter")) {
    options.push({ id: "setter", label: "Setter", href: "/setter" });
  }
  if (userHasPortalRole(roles, "erstgespraechler")) {
    options.push({
      id: "erstgespraechler",
      label: "Erstgesprächler",
      href: "/setter/eg",
    });
  }
  // Legacy-only ohne getrennte Rollen
  if (
    userHasPortalRole(roles, "setter_closer") &&
    !userHasPortalRole(roles, "setter") &&
    !userHasPortalRole(roles, "erstgespraechler")
  ) {
    options.push({
      id: "setter_closer",
      label: "Setter & Closer",
      href: "/setter",
    });
  }
  return options;
}

export async function setUserExtraRole(
  userId: string,
  role: Extract<
    UserRole,
    "therapist" | "setter" | "erstgespraechler" | "setter_closer" | "teamlead"
  >,
  enabled: boolean
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (enabled) {
    const { error } = await supabase.from("profile_extra_roles").upsert({
      user_id: userId,
      role,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from("profile_extra_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw new Error(error.message);
}
