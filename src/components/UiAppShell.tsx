"use client";

import { useUiShell } from "./UiShellProvider";
import { AppShellLegacy } from "./AppShellLegacy";
import { AppShellV2 } from "./AppShellV2";

export type ShellContentWidth = "default" | "wide";

type UiAppShellProps = {
  children: React.ReactNode;
  contentWidth?: ShellContentWidth;
};

export default function UiAppShell({
  children,
  contentWidth = "default",
}: UiAppShellProps) {
  const { version } = useUiShell();

  if (version === "v2") {
    return <AppShellV2 contentWidth={contentWidth}>{children}</AppShellV2>;
  }

  return <AppShellLegacy contentWidth={contentWidth}>{children}</AppShellLegacy>;
}
