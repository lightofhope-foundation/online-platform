"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveNavArea } from "@/lib/navConfig";

type SearchHit = {
  clientId: string;
  name: string;
  email: string | null;
  therapistLabel: string | null;
  href: string;
};

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-[#63eca9]/35 px-0.5 text-white">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function GlobalClientSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const area = resolveNavArea(pathname);
  const enabled = area !== "client";

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (!enabled) return;
        e.preventDefault();
        setOpen(true);
        queueMicrotask(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/staff/clients/search?q=${encodeURIComponent(q.trim())}`
          );
          if (!res.ok) {
            setResults([]);
            return;
          }
          const data = (await res.json()) as { results?: SearchHit[] };
          setResults(data.results ?? []);
        } catch {
          setResults([]);
        }
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [q, enabled]);

  const matchLabel = useMemo(() => {
    if (q.trim().length < 2) return null;
    if (pending) return "Suche …";
    return `${results.length} Treffer`;
  }, [q, pending, results.length]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 max-w-md">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          queueMicrotask(() => inputRef.current?.focus());
        }}
        className="flex w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-left text-sm text-white/55 transition hover:border-[#63eca9]/35 hover:bg-white/[0.07] hover:text-white/80"
        aria-label="Klient suchen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="flex-1 truncate">Klient suchen …</span>
        <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/12 bg-[#0b1210]/96 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/50" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, ID oder E-Mail …"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              autoFocus
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-full px-2 py-0.5 text-xs text-white/45 hover:bg-white/10 hover:text-white/80"
                aria-label="Leeren"
              >
                ✕
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5 text-[11px] text-white/40">
            <span>Schnellzugriff Klientenakte</span>
            <span>{matchLabel}</span>
          </div>

          <ul className="max-h-[340px] overflow-y-auto py-1">
            {q.trim().length < 2 ? (
              <li className="px-4 py-6 text-center text-sm text-white/35">
                Mindestens 2 Zeichen eingeben
              </li>
            ) : results.length === 0 && !pending ? (
              <li className="px-4 py-6 text-center text-sm text-white/35">
                Keine Treffer
              </li>
            ) : (
              results.map((hit) => (
                <li key={hit.clientId}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                      router.push(hit.href);
                    }}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-[#63eca9]/10"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-xs font-semibold text-[#63eca9]">
                      {hit.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">
                        {highlight(hit.name, q)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/40">
                        {hit.clientId}
                        {hit.therapistLabel ? ` · ${hit.therapistLabel}` : ""}
                        {hit.email ? ` · ${hit.email}` : ""}
                      </span>
                    </span>
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
