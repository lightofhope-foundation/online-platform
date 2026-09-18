export type UserRole =
  | "admin"
  | "therapist"
  | "setter"
  | "erstgespraechler"
  | "setter_closer"
  | "teamlead"
  | "patient"
  | "client";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  therapist: "Therapeut",
  setter: "Setter",
  erstgespraechler: "Erstgesprächler",
  setter_closer: "Setter & Closer",
  teamlead: "Teamleitung",
  client: "Klient",
  patient: "Klient",
};

/** Client-safe role label for UI (no server imports). */
export function formatProfileRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
