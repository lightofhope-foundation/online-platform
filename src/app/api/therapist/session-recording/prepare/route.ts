import { NextResponse } from "next/server";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import { userHasPortalRole } from "@/lib/userRoles";
import { buildSessionRecordingStoragePath } from "@/lib/sessionRecordingStorage";
import {
  getBunnyStorageDirectUploadTarget,
  isBunnyStorageConfigured,
} from "@/lib/bunnyStorage";

export const runtime = "nodejs";

/**
 * Prepare direct Bunny Storage upload (JSON errors — no Server-Action digest).
 * Body: { clientId, sessionId, title, fileName? }
 */
export async function POST(req: Request) {
  try {
    const { user, supabase, roles } = await checkTherapistAccess();
    const body = (await req.json()) as {
      clientId?: string;
      sessionId?: string;
      title?: string;
      fileName?: string;
    };

    const clientId = body.clientId?.trim();
    const sessionId = body.sessionId?.trim();
    const title = body.title?.trim();
    if (!clientId || !sessionId || !title) {
      return NextResponse.json(
        { error: "clientId, sessionId und title sind erforderlich." },
        { status: 400 }
      );
    }

    const resolved = await resolveClientProfileByClientId(supabase, clientId);
    const staffOverride =
      userHasPortalRole(roles, "admin") || userHasPortalRole(roles, "teamlead");
    if (!staffOverride) {
      await assertTherapistOwnsClient(supabase, user.id, resolved.userId);
    }

    if (!isBunnyStorageConfigured()) {
      return NextResponse.json(
        {
          error:
            "Bunny Storage fehlt in den Server-Env-Vars (BUNNY_STORAGE_ZONE_NAME / BUNNY_STORAGE_ACCESS_KEY). Bitte in Vercel Production setzen und neu deployen.",
          configured: false,
        },
        { status: 500 }
      );
    }

    const { data: session } = await supabase
      .from("therapy_sessions")
      .select("id, session_number, is_special, path_order, client_user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session || session.client_user_id !== resolved.userId) {
      return NextResponse.json(
        { error: "Sitzung nicht gefunden oder gehört nicht zu diesem Klienten." },
        { status: 404 }
      );
    }

    const { data: allSessions } = await supabase
      .from("therapy_sessions")
      .select("id, session_number, is_special, path_order")
      .eq("client_user_id", resolved.userId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, client_id")
      .eq("user_id", resolved.userId)
      .maybeSingle();

    // Folder = assigned therapist (not admin uploader), so new therapists get
    // their own Bunny folder on first recording PUT.
    const { data: assignment } = await supabase
      .from("clients")
      .select("therapist_user_id")
      .eq("user_id", resolved.userId)
      .maybeSingle();
    const therapistUserId = assignment?.therapist_user_id ?? user.id;
    const { data: therapistProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", therapistUserId)
      .maybeSingle();

    const extFromHint = body.fileName?.includes(".")
      ? body.fileName.split(".").pop()?.toLowerCase()
      : null;
    const extension =
      extFromHint && /^[a-z0-9]{2,5}$/.test(extFromHint) ? extFromHint : "mp4";

    const { storagePath } = buildSessionRecordingStoragePath({
      therapistFirstName: therapistProfile?.first_name,
      therapistLastName: therapistProfile?.last_name,
      therapistUserId,
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      clientId: profile?.client_id ?? resolved.clientId,
      session,
      allSessions: allSessions ?? [session],
      extension,
    });

    const target = getBunnyStorageDirectUploadTarget(storagePath);

    return NextResponse.json({
      ok: true,
      putUrl: target.putUrl,
      accessKey: target.accessKey,
      publicUrl: target.publicUrl,
      storagePath: target.storagePath,
      zone: target.zone,
      cdnHostHint: target.publicUrl.split("/")[2] ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Prepare fehlgeschlagen";
    const status =
      message === "Nicht autorisiert" || message === "Unauthorized" ? 401 : 500;
    console.error("[session-recording/prepare]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
