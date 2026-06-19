export type UiShellVersion = "legacy" | "v2";

export const DEFAULT_UI_SHELL_VERSION: UiShellVersion = "v2";

export const UI_SHELL_COOKIE = "loh_ui_shell";
export const UI_SHELL_STORAGE_KEY = "loh_ui_shell";

export function parseUiShellVersion(value: string | null | undefined): UiShellVersion {
  if (value === "legacy") return "legacy";
  if (value === "v2") return "v2";
  return DEFAULT_UI_SHELL_VERSION;
}

const SHELL_TOGGLE_SESSION_KEY = "loh_show_shell_toggle";

/** Classic/Neu-Slider standardmäßig aus. Wieder einschalten: `?showShellToggle=1` oder `NEXT_PUBLIC_UI_SHELL_TOGGLE=true` */
export function isUiShellToggleVisible(): boolean {
  if (process.env.NEXT_PUBLIC_UI_SHELL_TOGGLE === "true") return true;
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(SHELL_TOGGLE_SESSION_KEY) === "1") return true;
  if (new URLSearchParams(window.location.search).get("showShellToggle") === "1") {
    sessionStorage.setItem(SHELL_TOGGLE_SESSION_KEY, "1");
    return true;
  }
  return false;
}
