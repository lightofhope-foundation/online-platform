import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const pathname = req.nextUrl.pathname;
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api");

  // Only check session if not on public routes
  if (!isPublic) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If rate limited, allow the request to proceed (user might already be logged in)
      if (error && error.status !== 429) {
        console.error('Middleware auth error:', error);
      }

      if (!session && !isPublic) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    } catch (err) {
      // If auth check fails, allow login page access but block other pages
      if (!isPublic) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect logged-in users away from login page
  if (pathname.startsWith("/login")) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch (err) {
      // If session check fails on login page, allow access
      console.error('Middleware session check error:', err);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
