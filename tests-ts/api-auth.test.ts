import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";

import { POST as requestCodePost } from "../app/api/auth/request-code/route";
import { POST as verifyCodePost } from "../app/api/auth/verify-code/route";
import { GET as meGet } from "../app/api/auth/me/route";

function setupIsolatedEnv(): string {
  const root = mkdtempSync(join(tmpdir(), "obs-auth-test-"));
  process.env.OBS_DB_FILE = join(root, "db.json");
  process.env.OBS_STORAGE_DIR = join(root, "storage");
  return root;
}

test("auth request-code and verify-code flow", async () => {
  const root = setupIsolatedEnv();
  try {
    const req1 = new NextRequest("http://local/api/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "tester@example.com", displayName: "Tester", timezone: "Asia/Tokyo" })
    });
    const res1 = await requestCodePost(req1);
    assert.equal(res1.status, 200);
    const body1 = (await res1.json()) as { devCode?: string };
    assert.equal(typeof body1.devCode, "string");

    const req2 = new NextRequest("http://local/api/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "tester@example.com", code: body1.devCode })
    });
    const res2 = await verifyCodePost(req2);
    assert.equal(res2.status, 200);
    const cookie = res2.headers.get("set-cookie");
    assert.ok(cookie);

    const req3 = new NextRequest("http://local/api/auth/me", {
      method: "GET",
      headers: { cookie: cookie ?? "" }
    });
    const res3 = await meGet(req3);
    assert.equal(res3.status, 200);
    const body3 = (await res3.json()) as { user: { email: string } };
    assert.equal(body3.user.email, "tester@example.com");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
