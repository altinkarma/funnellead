import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authed = req.cookies.get("tss_auth")?.value === "ok";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Protect everything except the public funnel, auth endpoints, webhook, login page and static assets.
export const config = {
  matcher: [
    "/((?!login|f|api/auth|api/webhook|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
