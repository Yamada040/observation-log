import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { mergeObservation, validateByStatus } from "@/lib/observation-rules";
import { filterObservations } from "@/lib/search";
import { listObservations, putObservation } from "@/lib/store";
import { ObservationFilters, ObservationInput } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ code: "UNAUTHORIZED", message: "Login required" }, { status: 401 });
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  return n;
}

export async function GET(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const url = req.nextUrl;
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const perPage = Math.min(parsePositiveInt(url.searchParams.get("perPage"), 20), 50);

  const filters: ObservationFilters = {
    q: url.searchParams.get("q") ?? undefined,
    status: (url.searchParams.get("status") as ObservationFilters["status"]) ?? undefined,
    confidence: (url.searchParams.get("confidence") as ObservationFilters["confidence"]) ?? undefined,
    projectId: url.searchParams.get("projectId") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    sortBy: (url.searchParams.get("sortBy") as ObservationFilters["sortBy"]) ?? "updatedAt",
    sortOrder: (url.searchParams.get("sortOrder") as ObservationFilters["sortOrder"]) ?? "desc"
  };

  const filtered = filterObservations(listObservations(userId), filters);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  return NextResponse.json({
    items: filtered.slice(start, end),
    meta: {
      page: currentPage,
      perPage,
      total,
      totalPages
    }
  });
}

export async function POST(req: NextRequest) {
  const userId = requireUserId(req);
  if (!userId) {
    return unauthorized();
  }

  const payload = (await req.json()) as ObservationInput;
  const errors = validateByStatus(payload);

  if (errors.length > 0) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Required fields are missing", fields: errors },
      { status: 400 }
    );
  }

  const next = mergeObservation(null, payload, userId);
  putObservation(next);
  return NextResponse.json({ item: next }, { status: 201 });
}
