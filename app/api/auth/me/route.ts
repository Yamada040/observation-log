import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const user = findUserById(userId);
  if (!user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "User session is invalid" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
