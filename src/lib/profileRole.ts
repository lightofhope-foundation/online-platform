export type UserRole = "admin" | "therapist" | "patient" | "client";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  therapist: "Therapeut",
  client: "Klient",
  patient: "Klient",
};

/** Client-safe role label for UI (no server imports). */
export function formatProfileRole(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
}
