import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

test("update preserves snapshots for source paths that previously collided", () => {
  const root = fixture();
  try {
    rmSync(join(root, "prompts", "system.prompt.md"));
    mkdirSync(join(root, "prompts", "a"));
    writeFileSync(join(root, "prompts", "a", "b.md"), "nested\n", "utf8");
    writeFileSync(join(root, "prompts", "a__b.md"), "underscores\n", "utf8");

    const update = runSnapshots(root, "update");
    assert.equal(update.ok, true);
    assert.equal(update.created, 2);
    assert.equal(new Set(update.results.map((result) => result.snapshotPath)).size, 2);

    const check = runSnapshots(root, "check");
    assert.equal(check.ok, true);
    assert.equal(check.matched, 2);
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

test("update redacts secret-like prompt content before writing snapshots", () => {
  const root = fixture();
  try {
    writeFileSync(
      join(root, "prompts", "system.prompt.md"),
      "# System prompt\n\nAPI_TOKEN=sk_test_1234567890abcdef\n",
      "utf8"
    );
    const update = runSnapshots(root, "update");
    assert.equal(update.ok, true);
    const snapshot = readFileSync(join(root, "__snapshots__", "prompts__system.prompt.md.snap.md"), "utf8");
    assert.match(snapshot, /API_TOKEN=\[REDACTED\]/);
    assert.doesNotMatch(snapshot, /sk_test_1234567890abcdef/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
