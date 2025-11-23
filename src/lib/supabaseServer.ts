import { cookies } from "next/headers";

/**
 * Minimal user object extracted from the Supabase auth cookie.
 */
export type AuthUserFromCookie = {
  id: string;
  email: string;
};

function decodeJwtPayload(token: string): unknown | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // Convert from base64url to base64
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

/**
 * Read the Supabase auth cookie and extract a minimal user (id, email).
 * Returns null if the user is not logged in or the cookie is malformed.
 *
 * Handles both of these common formats:
 * - JSON: {"access_token": "...", ...}
 * - Raw JWT string: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export const getAuthUserFromCookie = async (): Promise<AuthUserFromCookie | null> => {
  const cookieStore = await cookies();

  // Try the known project-specific cookie first
  let authCookie = cookieStore.get("sb-tovojkwejkoysgygogfl-auth-token");

  // Fallback: find any cookie that looks like a Supabase auth cookie
  if (!authCookie) {
    const all = cookieStore.getAll();
    authCookie = all.find((c) => c.name.endsWith("-auth-token"));
  }

  if (!authCookie?.value) {
    return null;
  }

  let accessToken: string | null = null;

  // 1) Try JSON format first
  try {
    const parsed = JSON.parse(authCookie.value) as
      | {
          access_token?: string;
          accessToken?: string;
          currentSession?: { access_token?: string };
        }
      | string;

    if (typeof parsed === "string") {
      // Parsed to a plain string, treat as raw token below
      accessToken = parsed;
    } else {
      accessToken =
        parsed.access_token ??
        parsed.accessToken ??
        parsed.currentSession?.access_token ??
        null;
    }
  } catch {
    // Not JSON, fall through and treat as potential raw JWT below
  }

  // 2) If JSON parsing didn't give us a token, see if the value itself looks like a JWT
  if (!accessToken) {
    const raw = authCookie.value.trim();
    if (raw.split(".").length >= 3) {
      accessToken = raw;
    }
  }

  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken) as
    | { sub?: string; email?: string; user_metadata?: { email?: string } }
    | null;

  if (!payload?.sub) return null;

  const email =
    payload.email?.toLowerCase() ??
    payload.user_metadata?.email?.toLowerCase() ??
    "";

  if (!email) return null;

  return {
    id: payload.sub,
    email,
  };
};

