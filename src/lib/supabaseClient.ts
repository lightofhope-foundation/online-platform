"use client";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseBrowserClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) throw new Error("Missing Supabase env vars");
  return createClient(url, anonKey);
};


