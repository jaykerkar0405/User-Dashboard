/**
 * Middleware for handling authentication and route protection
 * Redirects users based on their authentication status and requested path
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
  // Extract pathname and auth token from the request
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth-token")?.value;

  // Define path types
  const isPublicPath = pathname === "/";
  const isProtectedPath = pathname.startsWith("/dashboard");

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedPath && !authToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users away from public routes
  if (isPublicPath && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
};

// Configure middleware to run on all routes except static assets and API routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
