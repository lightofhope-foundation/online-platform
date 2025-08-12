"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export const LogoutButton: React.FC<Props> = ({ className, children }) => {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <button type="button" onClick={onLogout} className={className}>
      {children}
    </button>
  );
};
