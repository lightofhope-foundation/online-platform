"use server";

import { cookies } from "next/headers";
import { UI_SHELL_COOKIE, type UiShellVersion } from "@/lib/uiShell";

export async function setUiShellVersion(version: UiShellVersion) {
  const jar = await cookies();
  jar.set(UI_SHELL_COOKIE, version, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
