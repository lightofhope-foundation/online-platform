"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type RoleView = {
  id: string;
  label: string;
  href: string;
};

function resolveActiveId(pathname: string, search: string, views: RoleView[]): string | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/teamlead")) return "teamlead";
  if (pathname.startsWith("/therapist")) return "therapist";
  if (pathname.startsWith("/setter")) {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (pathname.startsWith("/setter/eg") || params.get("view") === "eg") {
      return "erstgespraechler";
    }
    if (views.some((v) => v.id === "setter")) return "setter";
    if (views.some((v) => v.id === "erstgespraechler")) return "erstgespraechler";
    return "setter_closer";
  }
  return views[0]?.id ?? null;
}

function navigateSoft(router: ReturnType<typeof useRouter>, href: string) {
  const go = () => router.push(href);
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(go);
  } else {
    go();
  }
}

export function RoleViewSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [views, setViews] = useState<RoleView[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  const search = searchParams?.toString() ?? "";
  const activeFromRoute = resolveActiveId(pathname, search, views);
  const active = pendingId ?? activeFromRoute;

  useEffect(() => {
    // Clear optimistic state once the route catches up
    if (pendingId && activeFromRoute === pendingId) {
      setPendingId(null);
    }
  }, [pendingId, activeFromRoute]);

  if (views.length < 2) return null;

  return (
    <div
      className="flex flex-wrap rounded-full border border-white/15 bg-black/30 p-0.5 text-xs backdrop-blur-sm"
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
              if (isActive) return;
              setPendingId(view.id);
              startTransition(() => navigateSoft(router, view.href));
            }}
            className={[
              "rounded-full px-3 py-1.5 font-medium transition-all duration-200",
              isActive
                ? "bg-[#63eca9]/25 text-[#63eca9] shadow-[0_0_14px_rgba(99,236,169,0.25)]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white/85",
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
