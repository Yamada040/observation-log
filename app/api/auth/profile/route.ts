import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { updateUserProfile } from "@/lib/user-store";

export async function PATCH(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const body = (await req.json()) as { displayName?: string; timezone?: string };
  const displayName = body.displayName?.trim() || "";
  if (!displayName) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Display name is required", fields: ["displayName"] },
      { status: 400 }
    );
  }

  const user = updateUserProfile(userId, displayName, body.timezone || "Asia/Tokyo");
  if (!user) {
    return NextResponse.json({ code: "NOT_FOUND", message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
