import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

test("accounts isolate company data and enforce owner/editor/reader permissions", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "planly-api-"));
  const server = createApp({ dataDir: dir }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, method = "GET", body, cookie) => {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  assert.equal((await request("/workspace")).status, 401);
  const a = await request("/auth/register", "POST", {
    name: "Anna Owner",
    email: "anna@example.com",
    password: "secure-password-a",
    company: "Firma A",
  });
  const b = await request("/auth/register", "POST", {
    name: "Beata Owner",
    email: "beata@example.com",
    password: "secure-password-b",
    company: "Firma B",
  });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.ok(a.cookie.includes("planly_session="));
  const workspace = await request("/workspace", "GET", undefined, a.cookie);
  assert.equal(workspace.body.plans[0].company, "Firma A");
  workspace.body.plans[0].name = "Poufny plan A";
  assert.equal(
    (await request("/workspace", "PUT", workspace.body, a.cookie)).status,
    200,
  );
  const workspaceB = await request("/workspace", "GET", undefined, b.cookie);
  assert.equal(workspaceB.body.plans[0].company, "Firma B");
  assert.notEqual(workspaceB.body.plans[0].name, "Poufny plan A");
  const teamB = await request("/team", "GET", undefined, b.cookie);
  assert.equal(teamB.body.members.length, 1);
  assert.equal(teamB.body.members[0].email, "beata@example.com");
  const invite = await request(
    "/team/invite",
    "POST",
    { role: "reader" },
    a.cookie,
  );
  assert.equal(invite.status, 201);
  const reader = await request("/auth/register", "POST", {
    name: "Reader",
    email: "reader@example.com",
    password: "secure-password-reader",
    invitation: invite.body.invitation,
  });
  assert.equal(reader.status, 201);
  assert.equal(reader.body.user.role, "reader");
  const readerData = await request(
    "/workspace",
    "GET",
    undefined,
    reader.cookie,
  );
  assert.equal(readerData.body.plans[0].name, "Poufny plan A");
  assert.equal(
    (await request("/workspace", "PUT", readerData.body, reader.cookie)).status,
    403,
  );
  assert.equal(
    (await request("/team/invite", "POST", { role: "editor" }, reader.cookie))
      .status,
    403,
  );
  assert.equal(
    (
      await request("/auth/register", "POST", {
        name: "Second",
        email: "second@example.com",
        password: "secure-password-second",
        invitation: invite.body.invitation,
      })
    ).status,
    400,
  );
  const editorInvite = await request(
    "/team/invite",
    "POST",
    { role: "editor" },
    a.cookie,
  );
  const editor = await request("/auth/register", "POST", {
    name: "Editor",
    email: "editor@example.com",
    password: "secure-password-editor",
    invitation: editorInvite.body.invitation,
  });
  assert.equal(editor.body.user.role, "editor");
  assert.equal(
    (await request("/workspace", "PUT", workspace.body, editor.cookie)).status,
    200,
  );
  const invalid = structuredClone(workspace.body);
  invalid.plans[0].margin = 150;
  assert.equal(
    (await request("/workspace", "PUT", invalid, a.cookie)).status,
    400,
  );
  assert.equal(
    (
      await request("/auth/login", "POST", {
        email: "anna@example.com",
        password: "wrong-password",
      })
    ).status,
    401,
  );
  const login = await request("/auth/login", "POST", {
    email: "anna@example.com",
    password: "secure-password-a",
  });
  assert.equal(login.status, 200);
  assert.equal(
    (await request("/auth/me", "GET", undefined, login.cookie)).body.user
      .company,
    "Firma A",
  );
  assert.equal(
    (await request("/auth/logout", "POST", {}, login.cookie)).status,
    200,
  );
  assert.equal(
    (await request("/workspace", "GET", undefined, login.cookie)).status,
    401,
  );
});
