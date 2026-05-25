import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const REGISTRATION_GATE_COOKIE = "loh_reg_gate";

const GATE_MAX_AGE_SEC = 2 * 60 * 60; // 2 hours

function gateSecret(): string {
  return (
    process.env.REGISTRATION_GATE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "loh-registration-gate-dev"
  );
}

function signPayload(exp: number): string {
  const payload = String(exp);
  const sig = createHmac("sha256", gateSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGateToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", gateSecret())
    .update(expStr)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function hasRegistrationGateCookie(): Promise<boolean> {
  const jar = await cookies();
  return verifyGateToken(jar.get(REGISTRATION_GATE_COOKIE)?.value);
}

export async function setRegistrationGateCookie(): Promise<void> {
  const jar = await cookies();
  const exp = Date.now() + GATE_MAX_AGE_SEC * 1000;
  jar.set(REGISTRATION_GATE_COOKIE, signPayload(exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE_SEC,
  });
}

export async function clearRegistrationGateCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(REGISTRATION_GATE_COOKIE);
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
