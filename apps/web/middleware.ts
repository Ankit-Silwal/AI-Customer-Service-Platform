import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GATED = ["/workspaces", "/knowledge", "/conversations", "/tickets", "/analytics"];
const AUTH_PAGES = ["/login", "/register"];

/** Cookie-presence routing hint. Real session validity is enforced by the API
 *  (401) and the <RequireAuth> wall; this just keeps logged-out users on the
 *  intro/auth pages and logged-in users out of /login + /register. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get("sessionId")?.value;

  if (!hasSession && GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/workspaces";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/workspaces/:path*", "/knowledge/:path*", "/conversations/:path*", "/tickets/:path*", "/analytics/:path*", "/login", "/register"],
};
