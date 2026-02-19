import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { canTransition, mergeObservation, validateByStatus } from "@/lib/observation-rules";
import { deleteObservation, getObservation, putObservation } from "@/lib/store";
import { ObservationInput } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ code: "NOT_FOUND", message: "Observation not found" }, { status: 404 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id } = await ctx.params;
  const item = getObservation(userId, id);
  if (!item) {
    return notFound();
  }

  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id } = await ctx.params;
  const current = getObservation(userId, id);
  if (!current) {
    return notFound();
  }

  const payload = (await req.json()) as ObservationInput;
  const nextStatus = payload.status ?? current.status;
  if (!canTransition(current.status, nextStatus)) {
    return NextResponse.json(
      {
        code: "INVALID_TRANSITION",
        message: `Cannot transition from ${current.status} to ${nextStatus}`
      },
      { status: 400 }
    );
  }

  const merged = mergeObservation(current, payload, userId);
  const errors = validateByStatus(merged);
  if (errors.length > 0) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Required fields are missing", fields: errors },
      { status: 400 }
    );
  }

  putObservation(merged);
  return NextResponse.json({ item: merged });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const { id } = await ctx.params;
  const deleted = deleteObservation(userId, id);
  if (!deleted) {
    return notFound();
  }

  return NextResponse.json({ ok: true });
}
