import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./validate-readiness-docs.mjs", import.meta.url));
const run = () => spawnSync(process.execPath, [script], { encoding: "utf8" });

const result = run();
assert.equal(result.status, 0, result.stderr || result.stdout);

const readmePath = new URL("../README.md", import.meta.url);
const original = readFileSync(readmePath, "utf8");
try {
  await import("node:fs/promises").then(({ writeFile }) =>
    writeFile(readmePath, original.replace("The npm package is not published yet.", "")),
  );
  const invalid = run();
  assert.notEqual(invalid.status, 0, "validator must reject missing pre-release disclosure");
  assert.match(invalid.stderr, /pre-release status/);
} finally {
  await import("node:fs/promises").then(({ writeFile }) => writeFile(readmePath, original));
}
