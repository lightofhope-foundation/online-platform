"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { FontId } from "@/lib/platformFonts";
import {
  CORE_TOKEN_IDS,
  TYPOGRAPHY_BY_ID,
  buildDefaultTypographyConfig,
  type TypographyConfig,
} from "@/lib/typographyRegistry";
import {
  applyTypographyConfig,
  configToDbPatch,
  getTokenStyle,
  normalizeTypographyConfig,
} from "@/lib/typographyConfig";

type FontThemeContextValue = {
  config: TypographyConfig;
  saving: boolean;
  setTokenFont: (tokenId: string, font: FontId) => Promise<void>;
  setTokenSize: (tokenId: string, sizePx: number) => Promise<void>;
  pinToken: (tokenId: string) => Promise<void>;
  unpinToken: (tokenId: string) => Promise<void>;
};

const FontThemeContext = createContext<FontThemeContextValue | null>(null);
const BROADCAST_CHANNEL = "loh-font-settings";

function broadcast(config: TypographyConfig) {
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL);
    bc.postMessage({ type: "typography-config", config });
    bc.close();
  } catch {
    /* ignore */
  }
}

async function persist(config: TypographyConfig) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("platform_font_settings")
    .update({
      ...configToDbPatch(config),
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);
  if (error) throw error;
}

export function FontThemeProvider({
  children,
  initialConfig = buildDefaultTypographyConfig(),
}: {
  children: ReactNode;
  initialConfig?: TypographyConfig;
}) {
  const [config, setConfig] = useState<TypographyConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;
  const sizeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    applyTypographyConfig(config);
  }, [config]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("platform_font_settings")
        .select(
          "pinned_tokens, token_styles, headline_font, section_font, body_font, menu_font, headline_size_px, section_size_px, body_size_px, menu_size_px"
        )
        .eq("id", 1)
        .maybeSingle();
      if (!cancelled && data) {
        setConfig(normalizeTypographyConfig(data));
      }
    })();

    const channel = supabase
      .channel("platform_font_settings_v2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_font_settings",
        },
        (payload) => {
          if (payload.eventType === "DELETE" || !payload.new) return;
          setConfig(
            normalizeTypographyConfig(
              payload.new as Parameters<typeof normalizeTypographyConfig>[0]
            )
          );
        }
      )
      .subscribe();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.onmessage = (ev) => {
        if (ev.data?.type === "typography-config" && ev.data.config) {
          setConfig(ev.data.config as TypographyConfig);
        }
      };
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
      bc?.close();
      Object.values(sizeTimers.current).forEach(clearTimeout);
    };
  }, []);

  const commit = useCallback(async (next: TypographyConfig, debounceKey?: string) => {
    setConfig(next);
    applyTypographyConfig(next);
    broadcast(next);

    const run = async () => {
      setSaving(true);
      try {
        await persist(next);
      } finally {
        setSaving(false);
      }
    };

    if (!debounceKey) {
      await run();
      return;
    }

    if (sizeTimers.current[debounceKey]) {
      clearTimeout(sizeTimers.current[debounceKey]);
    }
    sizeTimers.current[debounceKey] = setTimeout(() => {
      void run();
    }, 350);
  }, []);

  const setTokenFont = useCallback(
    async (tokenId: string, font: FontId) => {
      if (!TYPOGRAPHY_BY_ID[tokenId]) return;
      const prev = getTokenStyle(configRef.current, tokenId);
      const next: TypographyConfig = {
        ...configRef.current,
        styles: {
          ...configRef.current.styles,
          [tokenId]: { ...prev, font },
        },
      };
      await commit(next);
    },
    [commit]
  );

  const setTokenSize = useCallback(
    async (tokenId: string, sizePx: number) => {
      const token = TYPOGRAPHY_BY_ID[tokenId];
      if (!token) return;
      const clamped = Math.min(
        token.sizeMax,
        Math.max(token.sizeMin, Math.round(sizePx))
      );
      const prev = getTokenStyle(configRef.current, tokenId);
      const next: TypographyConfig = {
        ...configRef.current,
        styles: {
          ...configRef.current.styles,
          [tokenId]: { ...prev, sizePx: clamped },
        },
      };
      await commit(next, `size-${tokenId}`);
    },
    [commit]
  );

  const pinToken = useCallback(
    async (tokenId: string) => {
      if (!TYPOGRAPHY_BY_ID[tokenId]) return;
      if (configRef.current.pinned.includes(tokenId)) return;
      const next: TypographyConfig = {
        ...configRef.current,
        pinned: [...configRef.current.pinned, tokenId],
        styles: {
          ...configRef.current.styles,
          [tokenId]:
            configRef.current.styles[tokenId] ??
            {
              font: TYPOGRAPHY_BY_ID[tokenId].defaultFont,
              sizePx: TYPOGRAPHY_BY_ID[tokenId].defaultSizePx,
            },
        },
      };
      await commit(next);
    },
    [commit]
  );

  const unpinToken = useCallback(
    async (tokenId: string) => {
      if (CORE_TOKEN_IDS.includes(tokenId)) return;
      const next: TypographyConfig = {
        ...configRef.current,
        pinned: configRef.current.pinned.filter((id) => id !== tokenId),
      };
      await commit(next);
    },
    [commit]
  );

  const value = useMemo(
    () => ({
      config,
      saving,
      setTokenFont,
      setTokenSize,
      pinToken,
      unpinToken,
    }),
    [config, saving, setTokenFont, setTokenSize, pinToken, unpinToken]
  );

  return (
    <FontThemeContext.Provider value={value}>{children}</FontThemeContext.Provider>
  );
}

export function useFontTheme() {
  const ctx = useContext(FontThemeContext);
  if (!ctx) {
    throw new Error("useFontTheme must be used within FontThemeProvider");
  }
  return ctx;
}
