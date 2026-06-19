import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const ADMIN_EMAIL = "info@oag-media.com";

const CLIENT_ONLY_PREFIXES = ["/courses", "/video", "/settings"];

function isClientOnlyPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return CLIENT_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

async function resolveRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  email: string
): Promise<"admin" | "therapist" | "client"> {
  if (email.toLowerCase() === ADMIN_EMAIL) return "admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.role === "admin") return "admin";
  if (profile?.role === "therapist") return "therapist";
  return "client";
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

  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error && error.status !== 429) {
      console.error("Middleware auth error:", error);
    }

    if (!isPublic && !session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (session?.user) {
      const role = await resolveRole(
        supabase,
        session.user.id,
        session.user.email ?? ""
      );

      if (pathname.startsWith("/login") || pathname.startsWith("/registrierung")) {
        const url = req.nextUrl.clone();
        url.pathname =
          role === "admin" ? "/admin" : role === "therapist" ? "/therapist" : "/";
        return NextResponse.redirect(url);
      }

      // Therapeut: kein Zugriff auf /admin (auch nicht /admin/therapist — Route ist /therapist)
      if (role === "therapist") {
        if (pathname.startsWith("/admin") || isClientOnlyPath(pathname)) {
          const url = req.nextUrl.clone();
          url.pathname = "/therapist";
          return NextResponse.redirect(url);
        }
      }

      if (role === "admin" && pathname.startsWith("/therapist")) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }

    return res;
  } catch (err) {
    console.error("Middleware error (continuing request):", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
