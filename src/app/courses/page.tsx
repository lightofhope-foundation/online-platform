"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import AppShell from "@/components/AppShell";

type Course = { id: string; title: string; slug: string };
type Profile = { role: "admin" | "therapist" | "patient" };

export default function CoursesPage() {
  const supabase = getSupabaseBrowserClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [role, setRole] = useState<Profile["role"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: me } = await supabase.auth.getUser();
      if (me?.user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", me.user.id).single();
        if (!cancelled && prof) setRole(prof.role as Profile["role"]);
      }
      const { data } = await supabase.from("courses").select("id,title,slug").eq("published", true).is("deleted_at", null).order("title", { ascending: true });
      if (!cancelled && data) setCourses(data as Course[]);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return (
    <AppShell title="Kurse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="text-white/70">Noch keine Kurse verfügbar.</div>
        ) : null}
        {courses.map((c) => (
          role === "admin" ? (
            <Link key={c.id} href={`/courses/${c.slug}`} className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.06] transition">
              <div className="text-lg font-semibold">{c.title}</div>
              <div className="mt-3 text-xs text-white/60">Admin-Ansicht: Klicke zum Verwalten von Videos</div>
            </Link>
          ) : (
            <Link key={c.id} href={`/courses/${c.slug}`} className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.06] transition">
              <div className="text-lg font-semibold">{c.title}</div>
            </Link>
          )
        ))}
      </div>
    </AppShell>
  );
}


