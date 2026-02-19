import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { readAttachmentFile, removeAttachmentFile } from "@/lib/attachments";
import { getObservation, putObservation } from "@/lib/store";

function unauthorized() {
  return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; attachmentId: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id, attachmentId } = await ctx.params;
  const current = getObservation(userId, id);
  if (!current) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Observation not found" }, { status: 404 });
  }

  const attachment = current.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Attachment not found" }, { status: 404 });
  }

  const bytes = readAttachmentFile(attachment);
  const disposition = attachment.kind === "csv" ? "attachment" : "inline";

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": attachment.mimeType,
      "content-disposition": `${disposition}; filename="${attachment.fileName}"`
    }
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; attachmentId: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id, attachmentId } = await ctx.params;
  const current = getObservation(userId, id);
  if (!current) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Observation not found" }, { status: 404 });
  }

  const attachment = current.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Attachment not found" }, { status: 404 });
  }

  removeAttachmentFile(attachment);

  const next = {
    ...current,
    attachments: current.attachments.filter((a) => a.id !== attachmentId),
    updatedAt: new Date().toISOString()
  };
  putObservation(next);

  return NextResponse.json({ ok: true });
}
