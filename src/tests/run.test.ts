import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runSnapshots } from "../run.js";

function fixture(withSnapshot = false): string {
  const dir = mkdtempSync(join(tmpdir(), "promptsnap-"));
  cpSync(new URL("../../fixtures/basic/", import.meta.url), dir, { recursive: true });
  if (!withSnapshot) rmSync(join(dir, "__snapshots__"), { recursive: true, force: true });
  return dir;
}

test("update creates snapshots and check passes", () => {
  const root = fixture();
  try {
    const update = runSnapshots(root, "update");
    assert.equal(update.ok, true);
    assert.equal(update.created, 1);
    const check = runSnapshots(root, "check");
    assert.equal(check.ok, true);
    assert.equal(check.matched, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check passes against committed fixture snapshot", () => {
  const root = fixture(true);
  try {
    const check = runSnapshots(root, "check");
    assert.equal(check.ok, true);
    assert.equal(check.matched, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check reports changed prompts", () => {
  const root = fixture();
  try {
    runSnapshots(root, "update");
    writeFileSync(join(root, "prompts", "system.prompt.md"), "# System prompt\n\nChanged behavior.\n", "utf8");
    const check = runSnapshots(root, "check");
    assert.equal(check.ok, false);
    assert.equal(check.changed, 1);
    assert.match(check.results[0]?.diff ?? "", /Changed behavior/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
