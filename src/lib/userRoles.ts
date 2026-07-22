import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { UserRole } from "@/lib/profileRole";

export type PortalRole = "admin" | "therapist" | "setter_closer" | "client" | "teamlead";

const PORTAL_ROLES: PortalRole[] = [
  "admin",
  "therapist",
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

  return [...roles];
}

export function userHasPortalRole(roles: PortalRole[], role: PortalRole): boolean {
  return roles.includes(role);
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
  if (userHasPortalRole(roles, "therapist")) {
    options.push({ id: "therapist", label: "Therapeut", href: "/therapist" });
  }
  if (userHasPortalRole(roles, "setter_closer")) {
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
  role: Extract<UserRole, "therapist" | "setter_closer" | "teamlead">,
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
