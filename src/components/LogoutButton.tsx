"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  className?: string;
  children?: React.ReactNode;
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

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      aria-busy={loading}
      className={`w-full flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm transition-all hover:bg-white/[0.08] hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(164,69,255,0.3)] ${className ?? ""}`}
    >
      {children}
      {loading && (
        <span className="ml-auto flex items-center gap-2 text-white/80">
          <span>Loggt aus …</span>
          <span className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        </span>
      )}
    </button>
  );
};
