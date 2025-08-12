"use client";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) throw new Error("Missing Supabase env vars");
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      storageKey: "loh-auth", // custom key to avoid multiple clients using default key
    },
  });
  return browserClient;
};


