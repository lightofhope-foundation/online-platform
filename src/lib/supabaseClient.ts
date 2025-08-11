"use client";

import { createBrowserClient } from "@supabase/supabase-js";

export const getSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }
  return createBrowserClient(url, anonKey);
};


