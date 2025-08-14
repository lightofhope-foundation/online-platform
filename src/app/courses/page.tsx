"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Course = { id: string; title: string; slug: string };

export default function CoursesPage() {
  const supabase = getSupabaseBrowserClient();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("courses").select("id,title,slug").eq("published", true).is("deleted_at", null).order("title", { ascending: true });
      if (!cancelled && data) setCourses(data as Course[]);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return (
    <main className="relative z-10 min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Kurse</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.06] transition">
              <div className="text-lg font-semibold">{c.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}


