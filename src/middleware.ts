import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "itbantu_session";
const JWT_SECRET_STRING = process.env.JWT_SECRET || "itbantu-super-secret-jwt-key-2026-production-ready-64-bytes-entropy";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// Protected routes matching
const PROTECTED_PREFIXES = ["/dashboard", "/tickets", "/admin", "/settings", "/reports"];
const AUTH_ONLY_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let userPayload: { id: string; email: string; role: string } | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
      userPayload = {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
      };
    } catch {
      // Invalid token
      userPayload = null;
    }
  }

  // 1. Root route / immediately redirects to /dashboard (if logged in) or /login
  if (pathname === "/") {
    if (userPayload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from /login and /register
  if (userPayload && AUTH_ONLY_PAGES.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Redirect unauthenticated users from protected pages
  const isProtected = PROTECTED_PREFIXES.some((path) => pathname.startsWith(path));
  if (!userPayload && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin-only route guard
  if (pathname.startsWith("/admin")) {
    if (userPayload?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/register|images|public).*)",
  ],
};

