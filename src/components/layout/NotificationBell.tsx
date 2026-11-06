"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { formatGermanDateTime } from "@/lib/clientId";
import { resolveNavArea } from "@/lib/navConfig";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  kind: string;
  created_at: string;
  read_at: string | null;
};

export function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const area = resolveNavArea(pathname);
  const enabled =
    area === "therapist" ||
    area === "admin" ||
    area === "teamlead" ||
    area === "client";

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [pending, startTransition] = useTransition();
  const supabase = getSupabaseBrowserClient();

  const unread = items.filter((i) => !i.read_at).length;

  const load = useCallback(async () => {
    if (!enabled) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("staff_notifications")
      .select("id, title, body, href, kind, created_at, read_at")
      .eq("recipient_user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as Notif[]) ?? []);
  }, [enabled, supabase]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const t = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(t);
  }, [load, enabled]);

  if (!enabled) {
    return (
      <button
        type="button"
        aria-label="Benachrichtigungen"
        className="relative rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/40"
        disabled
      >
        <BellIcon />
      </button>
    );
  }

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((i) => (ids.includes(i.id) ? { ...i, read_at: i.read_at ?? now } : i))
    );
    await supabase
      .from("staff_notifications")
      .update({ read_at: now })
      .in("id", ids);
  };

  const markAllRead = () => {
    startTransition(async () => {
      await markRead(items.filter((i) => !i.read_at).map((i) => i.id));
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        aria-label="Benachrichtigungen"
        className="relative rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/90 transition hover:border-[#63eca9]/40 hover:bg-white/[0.08]"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#63eca9] px-1 text-[10px] font-semibold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-white/12 bg-[#0b1210]/96 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <span className="text-sm font-medium text-white">Benachrichtigungen</span>
            {unread > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={markAllRead}
                className="text-[11px] text-[#63eca9] hover:underline disabled:opacity-50"
              >
                Alle gelesen
              </button>
            ) : null}
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-white/40">
                Keine Benachrichtigungen
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="border-b border-white/[0.06] last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void (async () => {
                        if (!item.read_at) await markRead([item.id]);
                        const target = item.href?.trim();
                        if (target && target !== "#") router.push(target);
                      })();
                    }}
                    className={`block w-full px-3 py-3 text-left transition hover:bg-[#63eca9]/08 ${
                      item.read_at ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read_at ? (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#63eca9]" />
                      ) : (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm text-white">{item.title}</div>
                        {item.body ? (
                          <div className="mt-0.5 text-xs text-white/50">{item.body}</div>
                        ) : null}
                        <div className="mt-1 text-[10px] text-white/35">
                          {formatGermanDateTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
