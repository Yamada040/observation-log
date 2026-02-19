import { readDb, writeDb } from "./db";
import { Project, Tag } from "./types";

function normalizeName(name: string): string {
  return name.trim();
}

export function listProjects(userId: string): Project[] {
  return readDb().projects
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createProject(userId: string, name: string): Project {
  const db = readDb();
  const now = new Date().toISOString();
  const normalized = normalizeName(name);

  const existing = db.projects.find((p) => p.userId === userId && p.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    return existing;
  }

  const project: Project = {
    id: crypto.randomUUID(),
    userId,
    name: normalized,
    createdAt: now,
    updatedAt: now
  };

  db.projects.push(project);
  writeDb(db);
  return project;
}

export function deleteProject(userId: string, id: string): boolean {
  const db = readDb();
  const before = db.projects.length;
  db.projects = db.projects.filter((p) => !(p.userId === userId && p.id === id));

  if (db.projects.length === before) {
    return false;
  }

  for (const obs of db.observations) {
    if (obs.userId === userId && obs.projectId === id) {
      obs.projectId = null;
      obs.updatedAt = new Date().toISOString();
    }
  }

  writeDb(db);
  return true;
}

export function listTags(userId: string): Tag[] {
  return readDb().tags
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createTag(userId: string, name: string): Tag {
  const db = readDb();
  const now = new Date().toISOString();
  const normalized = normalizeName(name);

  const existing = db.tags.find((t) => t.userId === userId && t.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    return existing;
  }

  const tag: Tag = {
    id: crypto.randomUUID(),
    userId,
    name: normalized,
    createdAt: now,
    updatedAt: now
  };

  db.tags.push(tag);
  writeDb(db);
  return tag;
}

export function deleteTag(userId: string, id: string): boolean {
  const db = readDb();
  const target = db.tags.find((t) => t.userId === userId && t.id === id);
  if (!target) {
    return false;
  }

  db.tags = db.tags.filter((t) => !(t.userId === userId && t.id === id));
  for (const obs of db.observations) {
    if (obs.userId === userId) {
      obs.tags = obs.tags.filter((name) => name !== target.name);
      obs.updatedAt = new Date().toISOString();
    }
  }

  writeDb(db);
  return true;
}
