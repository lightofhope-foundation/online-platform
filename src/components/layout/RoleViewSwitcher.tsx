"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type RoleView = {
  id: string;
  label: string;
  href: string;
};

export function RoleViewSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [views, setViews] = useState<RoleView[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/portal-roles");
        if (!res.ok) return;
        const data = (await res.json()) as { views?: RoleView[] };
        if (!cancelled) setViews(data.views ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (views.length < 2) return null;

  const active =
    pathname.startsWith("/setter") ? "setter_closer" : "therapist";

  return (
    <div
      className="flex rounded-full border border-white/15 bg-black/30 p-0.5 text-xs"
      role="group"
      aria-label="Rollenansicht wechseln"
    >
      {views.map((view) => {
        const isActive = view.id === active;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => {
              if (!isActive) router.push(view.href);
            }}
            className={[
              "rounded-full px-3 py-1.5 font-medium transition-colors",
              isActive
                ? "bg-[#63eca9]/20 text-[#63eca9]"
                : "text-white/55 hover:text-white/80",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
