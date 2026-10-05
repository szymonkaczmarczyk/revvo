import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/auth/cookie";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isDocumentNavigation = request.method === "GET" && request.headers.get("sec-fetch-mode") === "navigate";
  if (token && isDocumentNavigation) response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image|brand/|video/|media/|api/|robots.txt|sitemap.xml).*)"],
};
