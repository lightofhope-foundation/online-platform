"use client";

import UiAppShell from "@/components/UiAppShell";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default function HomeClient() {
  return (
    <UiAppShell>
      <HomeDashboard />
    </UiAppShell>
  );
}
