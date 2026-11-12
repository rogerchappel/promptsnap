import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./validate-release-workflow.mjs", import.meta.url));
const run = () => spawnSync(process.execPath, [script], { encoding: "utf8" });

const result = run();
assert.equal(result.status, 0, result.stderr || result.stdout);

const workflowPath = new URL("../.github/workflows/release.yml", import.meta.url);
const original = readFileSync(workflowPath, "utf8");
try {
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(workflowPath, original.replace('test "$GITHUB_REF_NAME" = "v$package_version"', "")),
  );
  const invalid = run();
  assert.notEqual(invalid.status, 0, "validator must reject a missing package/tag consistency guard");
  assert.match(invalid.stderr, /reject a tag that differs/);
} finally {
  await import("node:fs/promises").then(({ writeFile }) => writeFile(workflowPath, original));
}
