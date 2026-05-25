import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

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

    // Only check session if not on public routes
    if (!isPublic) {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error && error.status !== 429) {
        console.error("Middleware auth error:", error);
      }

      if (!session) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    // Redirect logged-in users away from login / registrierung
    if (pathname.startsWith("/login") || pathname.startsWith("/registrierung")) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }

    return res;
  } catch (err) {
    // Edge Runtime can fail with Supabase auth-helpers (Node APIs). Let the request
    // proceed; layout/pages will handle auth and redirect to login if needed.
    console.error("Middleware error (continuing request):", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
