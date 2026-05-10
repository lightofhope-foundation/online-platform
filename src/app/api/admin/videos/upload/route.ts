import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const BUNNY_API_BASE = "https://video.bunnycdn.com";

function getBunnyConfig() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId?.trim() || !apiKey?.trim()) {
    throw new Error("Bunny Stream env vars are not configured");
  }
  return { libraryId, apiKey };
}

async function ensureAdmin() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Unauthorized");

  const emailWhitelisted = user.email === "info@oag-media.com";
  if (emailWhitelisted) return;

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();

    const formData = await req.formData();
    const videoId = String(formData.get("videoId") ?? "");
    const file = formData.get("file");

    if (!videoId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "videoId and file are required" },
        { status: 400 }
      );
    }

    const { libraryId, apiKey } = getBunnyConfig();
    const buffer = await file.arrayBuffer();
    const bunnyRes = await fetch(
      `${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: Buffer.from(buffer),
      }
    );

    if (!bunnyRes.ok) {
      const errText = await bunnyRes.text();
      return NextResponse.json(
        { error: `Bunny upload failed: ${errText}` },
        { status: bunnyRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
