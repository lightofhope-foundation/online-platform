"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/authRoles";

const CLIENT_ROLES: UserRole[] = ["client", "patient"];

export function isClientRole(role: UserRole | null): boolean {
  return role !== null && CLIENT_ROLES.includes(role);
}

/** Cached profile role for client-side guards (nav, hooks). */
export function useProfileRole() {
  const [role, setRole] = useState<UserRole | null>(null);
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
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole((data?.role as UserRole | undefined) ?? null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading, isClient: isClientRole(role) };
}
