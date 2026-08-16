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

test("repeated explicit inputs are processed once", () => {
  const root = fixture();
  try {
    const source = "prompts/system.prompt.md";
    const update = runSnapshots(root, "update", [source, source]);
    assert.equal(update.checked, 1);
    assert.equal(update.created, 1);
    assert.equal(update.results.length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("overlapping directory and file inputs are processed once", () => {
  const root = fixture();
  try {
    const update = runSnapshots(root, "update", ["prompts", "prompts/system.prompt.md"]);
    assert.equal(update.checked, 1);
    assert.equal(update.created, 1);
    assert.equal(update.results.length, 1);
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

test("reports warning thresholds without failing update, check, or diff", () => {
  const root = fixture();
  try {
    const configPath = join(root, "promptsnap.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.tokenBudget = { warnTokens: 1, maxTokens: 8000 };
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    writeFileSync(join(root, "prompts", "system.prompt.md"), `${"a".repeat(64)}\n`, "utf8");

    for (const command of ["update", "check", "diff"] as const) {
      const summary = runSnapshots(root, command);
      assert.equal(summary.ok, true);
      assert.equal(summary.warnings, 1);
      assert.equal(summary.results[0]?.tokens, 16);
      assert.equal(summary.results[0]?.warning, true);
      assert.equal(summary.results[0]?.warnTokens, 1);
      assert.match(summary.results[0]?.warningMessage ?? "", /16 tokens exceeds warning threshold 1/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("max token budgets continue to fail as over-budget", () => {
  const root = fixture();
  try {
    const configPath = join(root, "promptsnap.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.tokenBudget = { warnTokens: 1, maxTokens: 1 };
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const update = runSnapshots(root, "update");
    assert.equal(update.ok, false);
    assert.equal(update.overBudget, 1);
    assert.equal(update.warnings, 0);
    assert.equal(update.results[0]?.status, "over-budget");
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
