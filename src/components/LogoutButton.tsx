"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  className?: string;
  children?: React.ReactNode; // expected: [icon, label]
};

export const LogoutButton: React.FC<Props> = ({ className, children }) => {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  // Try to preserve the first child as an icon when loading
  const icon = Array.isArray(children) ? children[0] : null;

  const isGlassNav = className?.includes("glass-nav-link");
  const legacyStyles = isGlassNav
    ? ""
    : "border border-white/10 hover:bg-white/[0.08] hover:border-[#63eca9]/50 hover:shadow-[0_0_20px_rgba(99,236,169,0.3)]";

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      aria-busy={loading}
      className={`flex w-full items-center gap-3 rounded-full px-5 py-3 text-sm transition-all ${legacyStyles} ${className ?? ""}`}
    >
      {!loading ? (
        <>{children}</>
      ) : (
        <>
          {icon}
          <span className="text-white/90">Loggt aus …</span>
          <span className="ml-auto inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        </>
      )}
    </button>
  );
};
