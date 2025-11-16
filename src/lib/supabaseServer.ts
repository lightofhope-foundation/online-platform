import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const getSupabaseServerClient = (): SupabaseClient<Database> => {
  // createServerComponentClient reads auth session from cookies
  // No explicit URL/KEY is needed when using @supabase/auth-helpers-nextjs
  return createServerComponentClient<Database>({ cookies });
};


