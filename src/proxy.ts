import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/f", "/api/auth", "/api/webhook", "/_next", "/favicon", "/robots.txt", "/sitemap.xml"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — bypass auth
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authed = req.cookies.get("tss_auth")?.value === "ok";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
