import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { defaultConfig } from "../config.js";
import { discoverSources } from "../discover.js";

function fixture() {
  const parent = mkdtempSync(join(tmpdir(), "promptsnap-discovery-"));
  const root = join(parent, "project");
  const outside = join(parent, "outside.md");
  mkdirSync(root);
  writeFileSync(outside, "private prompt\n");
  symlinkSync(outside, join(root, "linked.md"));
  return { root, outside };
}

test("skips explicit traversal and symlink inputs outside the project", () => {
  const { root } = fixture();
  assert.deepEqual(discoverSources(root, ["../outside.md", "linked.md"], defaultConfig), []);
});

test("directory walks skip symlinks that resolve outside the project", () => {
  const { root } = fixture();
  assert.deepEqual(discoverSources(root, [], defaultConfig), []);
});
