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

export type BackgroundLayers = {
  galaxy: boolean;
  lightRays: boolean;
};

const DEFAULT_LAYERS: BackgroundLayers = {
  galaxy: true,
  lightRays: true,
};

const STORAGE_KEY = "loh-bg-layers-v2";

type BackgroundLayersContextValue = {
  layers: BackgroundLayers;
  setLayer: (key: keyof BackgroundLayers, enabled: boolean) => void;
  toggleLayer: (key: keyof BackgroundLayers) => void;
};

const BackgroundLayersContext = createContext<BackgroundLayersContextValue | null>(
  null
);

function readStoredLayers(): BackgroundLayers {
  if (typeof window === "undefined") return DEFAULT_LAYERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYERS;
    const parsed = JSON.parse(raw) as Partial<BackgroundLayers>;
    return {
      galaxy:
        typeof parsed.galaxy === "boolean" ? parsed.galaxy : DEFAULT_LAYERS.galaxy,
      lightRays:
        typeof parsed.lightRays === "boolean"
          ? parsed.lightRays
          : DEFAULT_LAYERS.lightRays,
    };
  } catch {
    return DEFAULT_LAYERS;
  }
}

export function BackgroundLayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<BackgroundLayers>(() => readStoredLayers());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLayers(readStoredLayers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layers));
    } catch {
      /* ignore */
    }
  }, [layers, hydrated]);

  const setLayer = useCallback((key: keyof BackgroundLayers, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: enabled }));
  }, []);

  const toggleLayer = useCallback((key: keyof BackgroundLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const value = useMemo(
    () => ({ layers, setLayer, toggleLayer }),
    [layers, setLayer, toggleLayer]
  );

  return (
    <BackgroundLayersContext.Provider value={value}>
      {children}
    </BackgroundLayersContext.Provider>
  );
}

export function useBackgroundLayers() {
  const ctx = useContext(BackgroundLayersContext);
  if (!ctx) {
    throw new Error("useBackgroundLayers must be used within BackgroundLayersProvider");
  }
  return ctx;
}
