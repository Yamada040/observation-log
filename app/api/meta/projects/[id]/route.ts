import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { deleteProject } from "@/lib/taxonomy-store";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = deleteProject(userId, id);
  if (!ok) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
