"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { PlatformBackground } from "@/components/PlatformBackground";
import { UiShellProvider } from "@/components/UiShellProvider";
import type { UiShellVersion } from "@/lib/uiShell";

export function Providers({
  children,
  initialUiShell,
}: {
  children: ReactNode;
  initialUiShell: UiShellVersion;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <UiShellProvider initialVersion={initialUiShell}>
        <PlatformBackground />
        {children}
      </UiShellProvider>
    </QueryClientProvider>
  );
}


