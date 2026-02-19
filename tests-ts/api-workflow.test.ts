import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";

import { POST as requestCodePost } from "../app/api/auth/request-code/route";
import { POST as verifyCodePost } from "../app/api/auth/verify-code/route";
import { GET as listGet, POST as createPost } from "../app/api/observations/route";
import { GET as detailGet, PATCH as detailPatch } from "../app/api/observations/[id]/route";
import { GET as exportGet } from "../app/api/export/observation/[id]/route";

function setupIsolatedEnv(): string {
  const root = mkdtempSync(join(tmpdir(), "obs-flow-test-"));
  process.env.OBS_DB_FILE = join(root, "db.json");
  process.env.OBS_STORAGE_DIR = join(root, "storage");
  return root;
}

async function authCookie(email: string): Promise<string> {
  const requestCodeReq = new NextRequest("http://local/api/auth/request-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email })
  });
  const requestCodeRes = await requestCodePost(requestCodeReq);
  const code = ((await requestCodeRes.json()) as { devCode: string }).devCode;

  const verifyReq = new NextRequest("http://local/api/auth/verify-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code })
  });
  const verifyRes = await verifyCodePost(verifyReq);
  const cookie = verifyRes.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("cookie was not set");
  }
  return cookie;
}

test("API workflow create -> search -> detail -> export", async () => {
  const root = setupIsolatedEnv();
  try {
    const cookie = await authCookie("workflow@example.com");

    const invalidReq = new NextRequest("http://local/api/observations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ status: "Active", title: "incomplete" })
    });
    const invalidRes = await createPost(invalidReq);
    assert.equal(invalidRes.status, 400);

    const createReq = new NextRequest("http://local/api/observations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        title: "Disk alert",
        observation: "disk usage over 90%",
        context: [{ key: "env", value: "prod" }],
        interpretation: "cleanup failed",
        nextAction: "rerun cleanup",
        status: "Active",
        confidence: "High",
        tags: ["incident"],
        projectId: "project-alpha"
      })
    });

    const createRes = await createPost(createReq);
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as { item: { id: string } };

    const listReq = new NextRequest(
      "http://local/api/observations?q=Disk&status=Active&tag=incident&projectId=project-alpha&sortBy=updatedAt&sortOrder=desc",
      { method: "GET", headers: { cookie } }
    );
    const listRes = await listGet(listReq);
    assert.equal(listRes.status, 200);
    const listed = (await listRes.json()) as { items: Array<{ id: string }> };
    assert.equal(listed.items.length, 1);
    assert.equal(listed.items[0].id, created.item.id);

    const detailReq = new NextRequest(`http://local/api/observations/${created.item.id}`, {
      method: "GET",
      headers: { cookie }
    });
    const detailRes = await detailGet(detailReq, { params: Promise.resolve({ id: created.item.id }) });
    assert.equal(detailRes.status, 200);

    const archiveReq = new NextRequest(`http://local/api/observations/${created.item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ status: "Archived" })
    });
    const archiveRes = await detailPatch(archiveReq, { params: Promise.resolve({ id: created.item.id }) });
    assert.equal(archiveRes.status, 200);

    const exportReq = new NextRequest(`http://local/api/export/observation/${created.item.id}`, {
      method: "GET",
      headers: { cookie }
    });
    const exportRes = await exportGet(exportReq, { params: Promise.resolve({ id: created.item.id }) });
    assert.equal(exportRes.status, 200);
    const markdown = await exportRes.text();
    assert.ok(markdown.includes("## Observation"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
