import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily keep-alive so Supabase Free projects don't auto-pause from inactivity.
 * Secured via CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const ok =
    Boolean(secret) &&
    (auth === `Bearer ${secret}` ||
      request.headers.get("x-cron-secret") === secret);

  // Allow Vercel Cron (adds Authorization when CRON_SECRET is set) or manual with secret
  if (secret && !ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "missing supabase env" },
      { status: 500 }
    );
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const started = Date.now();
  const { count, error } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        ms: Date.now() - started,
        at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    profiles: count ?? 0,
    ms: Date.now() - started,
    at: new Date().toISOString(),
  });
}
