import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "nhaminh-auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets, API routes, and /login itself
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get(AUTH_COOKIE);

  if (!authCookie || authCookie.value !== process.env.GLOBAL_PASSWORD) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)"],
};
