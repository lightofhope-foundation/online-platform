import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { uploadBunnyStorageFile } from "@/lib/bunnyStorage";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  try {
    await checkAdminAccess();

    const form = await req.formData();
    const file = form.get("file");
    const clientIdRaw = form.get("clientId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Nur JPEG, PNG, WebP oder GIF." },
        { status: 400 }
      );
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Max. 8 MB." }, { status: 400 });
    }

    const clientId =
      typeof clientIdRaw === "string" ? clientIdRaw.trim().toLowerCase() : "unknown";
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const path = `session-path-bg/${clientId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadBunnyStorageFile(path, buffer, file.type);

    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
