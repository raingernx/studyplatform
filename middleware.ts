import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";

// Auth protection middleware (auth guard for dashboard + admin)
const authMiddleware = withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Admin section — require ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export default function middleware(req: NextRequestWithAuth) {
  const { pathname } = req.nextUrl;

  // ── Backwards-compat: redirect old /th/... paths to the flat equivalents ──
  // Users with bookmarks like /th/dashboard will transparently land on /dashboard.
  if (pathname.startsWith("/th/") || pathname === "/th") {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/th" ? "/" : pathname.slice(3); // strip leading /th
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── Apply auth guard on protected routes ────────────────────────────────
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin")
  ) {
    return (authMiddleware as any)(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
