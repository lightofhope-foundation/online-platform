"use client";

import { useUiShell } from "./UiShellProvider";
import { AppShellLegacy } from "./AppShellLegacy";
import { AppShellV2 } from "./AppShellV2";

type UiAppShellProps = {
  children: React.ReactNode;
};

export default function UiAppShell({ children }: UiAppShellProps) {
  const { version } = useUiShell();

  if (version === "v2") {
    return <AppShellV2>{children}</AppShellV2>;
  }

  return <AppShellLegacy>{children}</AppShellLegacy>;
}
