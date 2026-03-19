import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

function stripPrefix(pathname: string, prefix: string) {
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore Next internals / public files / API routes.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Canonicalize legacy member login path.
  if (pathname === "/community/login") {
    const next = req.nextUrl.clone();
    next.pathname = "/login";
    next.search = search;
    return NextResponse.redirect(next);
  }

  // Canonicalize old community URLs to new root-based community URLs,
  // except the member login which stays under /community/login.
  if (
    (pathname === "/community" || pathname.startsWith("/community/")) &&
    pathname !== "/community/login"
  ) {
    const next = req.nextUrl.clone();
    next.pathname = stripPrefix(pathname, "/community");
    next.search = search;
    return NextResponse.redirect(next);
  }

  // Canonicalize old admin URLs to new /admin URLs.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const next = req.nextUrl.clone();
    next.pathname = `/admin${stripPrefix(pathname, "/dashboard")}`;
    next.search = search;
    return NextResponse.redirect(next);
  }

  // Admin login is exposed at /admin/login (internally served by /login).
  // Must be handled before the general /admin/* rewrite.
  if (pathname === "/admin/login") {
    const next = req.nextUrl.clone();
    next.pathname = "/login";
    next.search = search;
    return NextResponse.rewrite(next);
  }

  // /admin/* should serve existing dashboard routes under /dashboard/*.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const next = req.nextUrl.clone();
    next.pathname = `/dashboard${stripPrefix(pathname, "/admin")}`;
    next.search = search;
    return NextResponse.rewrite(next);
  }

  // Member login is exposed at /login (internally served by /community/login).
  if (pathname === "/login") {
    const next = req.nextUrl.clone();
    next.pathname = "/community/login";
    next.search = search;
    return NextResponse.rewrite(next);
  }

  // Everything else is community. Rewrite root URLs to existing /community/* routes.
  const next = req.nextUrl.clone();
  next.pathname = `/community${pathname === "/" ? "" : pathname}`;
  next.search = search;
  return NextResponse.rewrite(next);
}

export const config = {
  matcher: ["/((?!_next).*)"],
};

