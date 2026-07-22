import assert from "node:assert/strict";
import test from "node:test";
import { createSnapshot, parseSnapshot, serializeSnapshot, snapshotFileName } from "../snapshot.js";

test("serializes deterministic snapshots", () => {
  const record = createSnapshot("prompts/a.md", "hello\n", 2);
  const parsed = parseSnapshot(serializeSnapshot(record));
  assert.equal(parsed.source, "prompts/a.md");
  assert.equal(parsed.content, "hello\n");
  assert.equal(parsed.generatedAt, "deterministic");
});

test("creates safe snapshot filenames", () => {
  assert.equal(snapshotFileName("skills/core/prompt.md"), "skills__core__prompt.md.snap.md");
});

test("creates distinct filenames for paths that previously collided", () => {
  assert.equal(snapshotFileName("prompts/a/b.md"), "prompts__a__b.md.snap.md");
  assert.equal(snapshotFileName("prompts/a__b.md"), "prompts__a_5f_5fb.md.snap.md");
});
