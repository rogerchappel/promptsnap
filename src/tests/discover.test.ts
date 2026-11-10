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

test("matches globstar patterns across nested paths and path separators", () => {
  const { root } = fixture();
  mkdirSync(join(root, "prompts", "nested"), { recursive: true });
  writeFileSync(join(root, "prompts", "root.md"), "root prompt\n");
  writeFileSync(join(root, "prompts", "nested", "child.md"), "nested prompt\n");
  writeFileSync(join(root, "prompts", "nested", "ignore.txt"), "not a prompt\n");
  const config = { ...defaultConfig, include: ["prompts/**/*.md"] };

  assert.deepEqual(
    discoverSources(root, [], config).map((source) => source.relativePath),
    ["prompts/nested/child.md", "prompts/root.md"],
  );
});

test("skips explicit traversal and symlink inputs outside the project", () => {
  const { root } = fixture();
  assert.deepEqual(discoverSources(root, ["../outside.md", "linked.md"], defaultConfig), []);
});

test("directory walks skip symlinks that resolve outside the project", () => {
  const { root } = fixture();
  assert.deepEqual(discoverSources(root, [], defaultConfig), []);
});
