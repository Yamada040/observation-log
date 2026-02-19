import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { toObservationMarkdown } from "@/lib/markdown";
import { getObservation } from "@/lib/store";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const item = getObservation(userId, id);
  if (!item) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Observation not found" }, { status: 404 });
  }

  const markdown = toObservationMarkdown(item);
  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename=observation-${id}.md`
    }
  });
}
