import { readDb, writeDb } from "./db";
import { User } from "./types";

export function findUserByEmail(email: string): User | null {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email === normalized) ?? null;
}

export function findUserById(id: string): User | null {
  const db = readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export function upsertUser(email: string, displayName?: string, timezone?: string): User {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const existing = db.users.find((u) => u.email === normalized);
  if (existing) {
    const next = {
      ...existing,
      displayName: displayName?.trim() || existing.displayName,
      timezone: timezone?.trim() || existing.timezone,
      updatedAt: now
    };
    db.users = db.users.map((u) => (u.id === existing.id ? next : u));
    writeDb(db);
    return next;
  }

  const created: User = {
    id: crypto.randomUUID(),
    email: normalized,
    displayName: displayName?.trim() || normalized,
    timezone: timezone?.trim() || "Asia/Tokyo",
    createdAt: now,
    updatedAt: now
  };

  db.users.push(created);
  writeDb(db);
  return created;
}

export function updateUserProfile(userId: string, displayName: string, timezone: string): User | null {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) {
    return null;
  }

  const next: User = {
    ...db.users[idx],
    displayName: displayName.trim(),
    timezone: timezone.trim() || db.users[idx].timezone,
    updatedAt: new Date().toISOString()
  };

  db.users[idx] = next;
  writeDb(db);
  return next;
}
