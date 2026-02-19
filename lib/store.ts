import { removeAttachmentFile } from "./attachments";
import { readDb, writeDb } from "./db";
import { Observation } from "./types";

export function putObservation(item: Observation): Observation {
  const db = readDb();
  const idx = db.observations.findIndex((x) => x.id === item.id && x.userId === item.userId);
  if (idx >= 0) {
    db.observations[idx] = item;
  } else {
    db.observations.push(item);
  }
  writeDb(db);
  return item;
}

export function getObservation(userId: string, id: string): Observation | null {
  const db = readDb();
  return db.observations.find((x) => x.userId === userId && x.id === id) ?? null;
}

export function deleteObservation(userId: string, id: string): boolean {
  const db = readDb();
  const target = db.observations.find((x) => x.userId === userId && x.id === id);
  if (!target) {
    return false;
  }

  for (const attachment of target.attachments) {
    removeAttachmentFile(attachment);
  }

  db.observations = db.observations.filter((x) => !(x.userId === userId && x.id === id));
  writeDb(db);
  return true;
}

export function listObservations(userId: string): Observation[] {
  const db = readDb();
  return db.observations.filter((x) => x.userId === userId);
}
