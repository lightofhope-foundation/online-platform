import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight auth gate — cookie presence only, NO Supabase API calls.
 * Calling getSession() here caused ~20k auth requests/hour in dev (token refresh per request).
 * Role routing lives in route layouts (admin / therapist / client).
 */
function hasAuthCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some(
    (c) => c.name.includes("-auth-token") && c.value.length > 20
  );
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registrierung") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/reset-admin-pw");

  if (isPublic) {
    return NextResponse.next();
  }

  if (!hasAuthCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|login|registrierung).*)",
  ],
};
