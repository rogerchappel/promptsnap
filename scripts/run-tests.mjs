import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const testsDirectory = new URL("../dist/tests/", import.meta.url);

let testFiles;
try {
  testFiles = (await readdir(testsDirectory))
    .filter((file) => file.endsWith(".test.js"))
    .sort()
    .map((file) => new URL(file, testsDirectory));
} catch (error) {
  console.error(
    `Unable to discover compiled tests in ${testsDirectory.pathname}: ${error.message}`,
  );
  process.exit(1);
}

if (testFiles.length === 0) {
  console.error(`No compiled test files found in ${testsDirectory.pathname}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--test", ...testFiles.map((file) => file.pathname)],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Unable to start the Node.js test runner: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
