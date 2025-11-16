import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseServerClient = <T = Record<string, never>>(): SupabaseClient<T> => {
  // createServerComponentClient reads auth session from cookies
  // No explicit URL/KEY is needed when using @supabase/auth-helpers-nextjs
  return createServerComponentClient<T>({ cookies });
};


