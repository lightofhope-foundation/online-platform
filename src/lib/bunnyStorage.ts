/**
 * Bunny Storage (pull zone) helpers for static assets (e.g. Sitzungsakte backgrounds).
 * Requires BUNNY_STORAGE_ZONE_NAME + BUNNY_STORAGE_ACCESS_KEY + NEXT_PUBLIC_BUNNY_STORAGE_CDN_HOST
 */

function getStorageConfig() {
  const zone = process.env.BUNNY_STORAGE_ZONE_NAME?.trim();
  const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY?.trim();
  const cdnHost = (
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_CDN_HOST ??
    process.env.BUNNY_STORAGE_CDN_HOST ??
    "lightofhope.b-cdn.net"
  )
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!zone || !accessKey) {
    throw new Error(
      "Bunny Storage ist nicht konfiguriert. Bitte BUNNY_STORAGE_ZONE_NAME und BUNNY_STORAGE_ACCESS_KEY setzen — oder einen CDN-Link einfügen."
    );
  }

  return { zone, accessKey, cdnHost };
}

export function isBunnyStorageConfigured(): boolean {
  return Boolean(
    process.env.BUNNY_STORAGE_ZONE_NAME?.trim() &&
      process.env.BUNNY_STORAGE_ACCESS_KEY?.trim()
  );
}

export function publicBunnyStorageUrl(path: string): string {
  const host = (
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_CDN_HOST ??
    process.env.BUNNY_STORAGE_CDN_HOST ??
    "lightofhope.b-cdn.net"
  )
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `https://${host}/${clean}`;
}

export async function uploadBunnyStorageFile(
  path: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { zone, accessKey, cdnHost } = getStorageConfig();
  const cleanPath = path.replace(/^\//, "");
  const url = `https://storage.bunnycdn.com/${zone}/${cleanPath}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: accessKey,
      "Content-Type": contentType,
    },
    body: body instanceof Buffer ? body : Buffer.from(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny Storage Upload fehlgeschlagen (${res.status}): ${text}`);
  }

  return `https://${cdnHost}/${cleanPath}`;
}
