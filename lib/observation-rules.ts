import { Observation, ObservationInput, ObservationStatus } from "./types";

const REQUIRED_FIELDS: (keyof ObservationInput)[] = [
  "title",
  "observation",
  "context",
  "interpretation",
  "nextAction"
];

export function canTransition(from: ObservationStatus, to: ObservationStatus): boolean {
  if (from === to) {
    return true;
  }
  if (from === "Draft" && to === "Active") {
    return true;
  }
  if (from === "Active" && to === "Archived") {
    return true;
  }
  if (from === "Archived" && to === "Active") {
    return true;
  }
  return false;
}

export function missingRequiredFields(payload: ObservationInput): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = payload[field];
    if (field === "context") {
      if (!Array.isArray(value) || value.length === 0) {
        missing.push("context");
      }
      continue;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
      missing.push(field);
    }
  }

  return missing;
}

export function validateByStatus(payload: ObservationInput): string[] {
  const status = payload.status ?? "Draft";
  if (status === "Draft") {
    return [];
  }
  return missingRequiredFields(payload);
}

export function mergeObservation(current: Observation | null, payload: ObservationInput, userId: string): Observation {
  const now = new Date().toISOString();
  const id = current?.id ?? crypto.randomUUID();

  return {
    id,
    userId,
    title: payload.title ?? current?.title ?? "",
    observation: payload.observation ?? current?.observation ?? "",
    context: payload.context ?? current?.context ?? [],
    interpretation: payload.interpretation ?? current?.interpretation ?? "",
    nextAction: payload.nextAction ?? current?.nextAction ?? "",
    status: payload.status ?? current?.status ?? "Draft",
    confidence: payload.confidence ?? current?.confidence ?? "Medium",
    projectId: payload.projectId ?? current?.projectId ?? null,
    tags: payload.tags ?? current?.tags ?? [],
    links: payload.links ?? current?.links ?? [],
    attachments: payload.attachments ?? current?.attachments ?? [],
    createdAt: current?.createdAt ?? now,
    updatedAt: now
  };
}
