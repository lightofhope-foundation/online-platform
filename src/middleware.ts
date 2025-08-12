import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Allow public routes
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api") || pathname.startsWith("/vercel.svg");
  if (isPublic) return NextResponse.next();

  // Supabase JS stores a cookie named: sb-<project-ref>-auth-token
  const hasSbAuth = cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token") && c.value);

  if (!hasSbAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(?!_next|favicon|api).*"]
};
