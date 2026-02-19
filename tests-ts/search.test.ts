import test from "node:test";
import assert from "node:assert/strict";
import { filterObservations } from "../lib/search";
import { Observation } from "../lib/types";

const base: Omit<Observation, "id" | "title" | "status" | "confidence" | "tags" | "projectId" | "updatedAt" | "createdAt"> = {
  userId: "u1",
  observation: "disk usage exceeded threshold",
  context: [{ key: "env", value: "prod" }],
  interpretation: "cleanup job failed",
  nextAction: "rerun job",
  links: [],
  attachments: []
};

function obs(partial: Partial<Observation>): Observation {
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? "title",
    status: partial.status ?? "Draft",
    confidence: partial.confidence ?? "Medium",
    tags: partial.tags ?? [],
    projectId: partial.projectId ?? null,
    updatedAt: partial.updatedAt ?? "2026-02-18T00:00:00.000Z",
    createdAt: partial.createdAt ?? "2026-02-18T00:00:00.000Z",
    ...base,
    ...partial
  };
}

test("filterObservations supports q/status/tag/project/date/sort", () => {
  const items: Observation[] = [
    obs({ id: "1", title: "prod incident", status: "Active", tags: ["incident"], projectId: "p1", updatedAt: "2026-02-18T10:00:00.000Z" }),
    obs({ id: "2", title: "learning note", status: "Draft", tags: ["learning"], projectId: "p2", updatedAt: "2026-02-17T10:00:00.000Z" }),
    obs({ id: "3", title: "archived cleanup", status: "Archived", tags: ["incident"], projectId: "p1", updatedAt: "2026-02-16T10:00:00.000Z" })
  ];

  const r1 = filterObservations(items, { q: "incident", status: "Active", tag: "incident", projectId: "p1" });
  assert.equal(r1.length, 1);
  assert.equal(r1[0].id, "1");

  const r2 = filterObservations(items, { dateFrom: "2026-02-17", sortBy: "updatedAt", sortOrder: "asc" });
  assert.equal(r2.length, 2);
  assert.deepEqual(r2.map((x) => x.id), ["2", "1"]);
});
