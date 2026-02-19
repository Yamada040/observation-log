import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";
import { verifyAuthChallenge } from "@/lib/auth-challenge-store";
import { upsertUser } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; code?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const code = body.code?.trim() || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Valid email is required", fields: ["email"] }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Code is required", fields: ["code"] }, { status: 400 });
  }

  const verified = verifyAuthChallenge({ email, code });
  if (!verified.ok) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Invalid or expired code" }, { status: 401 });
  }

  const user = upsertUser(email, verified.displayName, verified.timezone);
  const res = NextResponse.json({ user });
  setAuthCookie(res, user.id);
  return res;
}
