import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { saveAttachmentFile } from "@/lib/attachments";
import { getObservation, putObservation } from "@/lib/store";

function unauthorized() {
  return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id } = await ctx.params;
  const current = getObservation(userId, id);
  if (!current) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Observation not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "file is required", fields: ["file"] }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "file must not be empty", fields: ["file"] },
      { status: 400 }
    );
  }

  try {
    const attachment = saveAttachmentFile({
      userId,
      observationId: id,
      fileName: file.name || "attachment",
      mimeType: file.type || "application/octet-stream",
      data: bytes
    });

    const next = {
      ...current,
      attachments: [attachment, ...current.attachments],
      updatedAt: new Date().toISOString()
    };
    putObservation(next);

    return NextResponse.json({ attachment });
  } catch (e) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: e instanceof Error ? e.message : "Attachment upload failed"
      },
      { status: 400 }
    );
  }
}
