/** Display name: "Andreas G." from first + last name */
export function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string | null
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first && last) {
    return `${first} ${last.charAt(0).toUpperCase()}.`;
  }
  if (first) return first;
  if (last) return last;
  if (email) {
    const local = email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Nutzer";
}

export function formatInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string | null
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  if (first) return first.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}
