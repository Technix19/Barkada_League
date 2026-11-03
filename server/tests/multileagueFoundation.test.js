import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { getBearerToken } from "../src/middleware/auth.js";
import { canManageLeague } from "../src/middleware/leagueAccess.js";

test("accepts only a well-formed Bearer token", () => {
  assert.equal(getBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(getBearerToken("bearer token123"), "token123");
  for (const bad of [undefined, "", "token", "Basic abc", "Bearer", "Bearer a b"]) {
    assert.equal(getBearerToken(bad), null);
  }
});

test("only owner/admin may manage league content", () => {
  assert.equal(canManageLeague("owner"), true);
  assert.equal(canManageLeague("admin"), true);
  for (const role of ["member", "viewer", null, undefined, "OWNER"]) {
    assert.equal(canManageLeague(role), false);
  }
});

test("unscoped routes are retired and league creation requires login", async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const legacy = await fetch(base + "/api/matches");
    assert.equal(legacy.status, 410);
    const login = await fetch(base + "/api/leagues", { method: "POST", headers: {
      "Content-Type": "application/json",
    }, body: JSON.stringify({ name: "My League" }) });
    assert.equal(login.status, 401);
    const list = await fetch(base + "/api/leagues");
    assert.equal(list.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) =>
      error ? reject(error) : resolve()));
  }
});
