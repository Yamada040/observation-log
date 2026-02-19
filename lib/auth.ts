import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "obs_user_id";

export function getUserIdFromRequest(req: NextRequest): string | null {
  const userId = req.cookies.get(AUTH_COOKIE)?.value;
  if (!userId || userId.trim().length === 0) {
    return null;
  }
  return userId;
}

export function requireUserId(req: NextRequest): string | null {
  return getUserIdFromRequest(req);
}

export function setAuthCookie(res: NextResponse, userId: string): void {
  res.cookies.set({
    name: AUTH_COOKIE,
    value: userId,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 0
  });
}
