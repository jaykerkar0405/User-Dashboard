import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("auth-token")?.value;

  const isPublicPath = pathname === "/";
  const isProtectedPath = pathname.startsWith("/dashboard");

  if (isProtectedPath && !authToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublicPath && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
