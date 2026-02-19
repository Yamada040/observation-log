import { readDb, writeDb } from "./db";

const TTL_MINUTES = 10;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createAuthChallenge(params: { email: string; displayName?: string; timezone?: string }): { challengeId: string; code: string; expiresAt: string } {
  const db = readDb();
  const now = Date.now();
  const expiresAt = new Date(now + TTL_MINUTES * 60 * 1000).toISOString();
  const email = normalizeEmail(params.email);

  db.authChallenges = db.authChallenges.filter((c) => !(c.email === email && new Date(c.expiresAt).getTime() > now));

  const code = generateCode();
  const challengeId = crypto.randomUUID();

  db.authChallenges.push({
    id: challengeId,
    email,
    code,
    displayName: params.displayName?.trim() || undefined,
    timezone: params.timezone?.trim() || undefined,
    createdAt: new Date(now).toISOString(),
    expiresAt
  });

  writeDb(db);
  return { challengeId, code, expiresAt };
}

export function verifyAuthChallenge(params: { email: string; code: string }): { ok: boolean; displayName?: string; timezone?: string } {
  const db = readDb();
  const now = Date.now();
  const email = normalizeEmail(params.email);
  const code = params.code.trim();

  const matched = db.authChallenges.find(
    (c) => c.email === email && c.code === code && new Date(c.expiresAt).getTime() > now
  );

  db.authChallenges = db.authChallenges.filter((c) => new Date(c.expiresAt).getTime() > now && !(c.email === email && c.code === code));
  writeDb(db);

  if (!matched) {
    return { ok: false };
  }

  return {
    ok: true,
    displayName: matched.displayName,
    timezone: matched.timezone
  };
}
