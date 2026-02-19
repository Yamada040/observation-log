import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Observation, Project, Tag, User } from "./types";

export type AuthChallenge = {
  id: string;
  email: string;
  code: string;
  displayName?: string;
  timezone?: string;
  expiresAt: string;
  createdAt: string;
};

export type DbShape = {
  users: User[];
  observations: Observation[];
  projects: Project[];
  tags: Tag[];
  authChallenges: AuthChallenge[];
};

function resolveDbFile(): string {
  const envPath = process.env.OBS_DB_FILE?.trim();
  if (envPath) {
    return envPath;
  }
  return join(process.cwd(), "db", "data.json");
}

function ensureDb(dbFile: string): void {
  const dir = dirname(dbFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(dbFile)) {
    const seed: DbShape = { users: [], observations: [], projects: [], tags: [], authChallenges: [] };
    writeFileSync(dbFile, JSON.stringify(seed, null, 2), "utf8");
  }
}

function normalizeObservations(items: Observation[]): Observation[] {
  return items.map((item) => ({
    ...item,
    context: Array.isArray(item.context) ? item.context : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    links: Array.isArray(item.links) ? item.links : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    projectId: item.projectId ?? null,
    confidence: item.confidence ?? "Medium",
    status: item.status ?? "Draft"
  }));
}

export function readDb(): DbShape {
  const dbFile = resolveDbFile();
  ensureDb(dbFile);
  const raw = readFileSync(dbFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<DbShape>;
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    observations: normalizeObservations(Array.isArray(parsed.observations) ? parsed.observations : []),
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    authChallenges: Array.isArray(parsed.authChallenges) ? parsed.authChallenges : []
  };
}

export function writeDb(data: DbShape): void {
  const dbFile = resolveDbFile();
  ensureDb(dbFile);
  writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf8");
}
