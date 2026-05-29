"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setUiShellVersion } from "@/app/actions/uiShell";
import {
  UI_SHELL_STORAGE_KEY,
  type UiShellVersion,
} from "@/lib/uiShell";

type UiShellContextValue = {
  version: UiShellVersion;
  setVersion: (version: UiShellVersion) => void;
};

const UiShellContext = createContext<UiShellContextValue | null>(null);

export function UiShellProvider({
  children,
  initialVersion,
}: {
  children: ReactNode;
  initialVersion: UiShellVersion;
}) {
  const [version, setVersionState] = useState<UiShellVersion>(initialVersion);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(UI_SHELL_STORAGE_KEY);
      if (stored === "v2" || stored === "legacy") {
        setVersionState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setVersion = useCallback((next: UiShellVersion) => {
    setVersionState(next);
    try {
      localStorage.setItem(UI_SHELL_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    void setUiShellVersion(next);
  }, []);

  const value = useMemo(
    () => ({ version, setVersion }),
    [version, setVersion]
  );

  return (
    <UiShellContext.Provider value={value}>{children}</UiShellContext.Provider>
  );
}

export function useUiShell() {
  const ctx = useContext(UiShellContext);
  if (!ctx) {
    throw new Error("useUiShell must be used within UiShellProvider");
  }
  return ctx;
}

export function useUiShellOptional(): UiShellContextValue | null {
  return useContext(UiShellContext);
}
