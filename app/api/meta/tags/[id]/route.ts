import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { deleteTag } from "@/lib/taxonomy-store";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = deleteTag(userId, id);
  if (!ok) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
