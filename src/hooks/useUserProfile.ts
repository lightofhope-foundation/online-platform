"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  displayAlias: string | null;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_alias")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile({
          firstName: data?.first_name ?? null,
          lastName: data?.last_name ?? null,
          email: user.email ?? null,
          displayAlias: data?.display_alias ?? null,
        });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
