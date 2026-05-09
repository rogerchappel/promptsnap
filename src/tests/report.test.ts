import assert from "node:assert/strict";
import test from "node:test";
import { formatSummary } from "../report.js";
import type { RunSummary } from "../types.js";

const summary: RunSummary = {
  command: "check",
  root: "/tmp/project",
  ok: false,
  checked: 1,
  created: 0,
  matched: 0,
  changed: 1,
  missing: 0,
  overBudget: 0,
  results: [{ source: "prompts/a.md", snapshotPath: "__snapshots__/a.snap.md", status: "changed", tokens: 12, diff: "--- a\n+++ b\n-old\n+new\n" }]
};

test("formats markdown reports", () => {
  assert.match(formatSummary(summary, "markdown"), /# promptsnap check failed/);
  assert.match(formatSummary(summary, "markdown"), /```diff/);
});

test("formats json reports", () => {
  assert.equal(JSON.parse(formatSummary(summary, "json")).changed, 1);
});
