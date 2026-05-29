export type UiShellVersion = "legacy" | "v2";

export const UI_SHELL_COOKIE = "loh_ui_shell";
export const UI_SHELL_STORAGE_KEY = "loh_ui_shell";

export function parseUiShellVersion(value: string | null | undefined): UiShellVersion {
  return value === "v2" ? "v2" : "legacy";
}

export function isUiShellToggleVisible(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_UI_SHELL_TOGGLE === "true"
  );
}
