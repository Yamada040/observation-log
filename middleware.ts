import { NextRequest, NextResponse } from "next/server";

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/observations")) {
    return true;
  }
  if (pathname.startsWith("/settings")) {
    return true;
  }
  if (pathname.startsWith("/api/observations")) {
    return true;
  }
  if (pathname.startsWith("/api/export")) {
    return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = req.cookies.get("obs_user_id")?.value;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (userId && userId.trim().length > 0) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/observations/:path*",
    "/settings/:path*",
    "/api/observations/:path*",
    "/api/export/:path*",
    "/api/meta/:path*"
  ]
};
