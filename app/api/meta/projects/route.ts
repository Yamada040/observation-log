import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/taxonomy-store";

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  return NextResponse.json({ items: listProjects(userId) });
}

export async function POST(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim() || "";
  if (!name) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "name is required", fields: ["name"] }, { status: 400 });
  }

  return NextResponse.json({ item: createProject(userId, name) }, { status: 201 });
}
