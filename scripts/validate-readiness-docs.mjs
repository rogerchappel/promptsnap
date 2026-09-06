import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const security = readFileSync(new URL("../SECURITY.md", import.meta.url), "utf8");
const prd = readFileSync(new URL("../docs/PRD.md", import.meta.url), "utf8");

const unpublished = readme.indexOf("The npm package is not published yet.");
const sourceInstall = readme.indexOf("npm ci", unpublished);
const sourceBuild = readme.indexOf("npm run build", sourceInstall);
const cliCheck = readme.indexOf("node dist/cli.js --help", sourceBuild);
const registryInstall = readme.indexOf("npm install --save-dev promptsnap");
const afterPublication = readme.indexOf("After the package is published to npm");

assert(unpublished >= 0, "README must state the package's pre-release status");
assert(sourceInstall > unpublished, "README must lead pre-release users through a clean install");
assert(sourceBuild > sourceInstall, "README must build after installing source dependencies");
assert(cliCheck > sourceBuild, "README must verify the built CLI");
assert(afterPublication > cliCheck, "README must reserve registry guidance for post-publication use");
assert(registryInstall > afterPublication, "README registry install must appear only after its publication qualifier");

assert.doesNotMatch(
  security,
  /private vulnerability reporting/i,
  "SECURITY.md must not claim disabled GitHub private vulnerability reporting",
);
assert.match(security, /miscanalysis@gmail\.com/, "SECURITY.md must name an available private reporting route");
assert.match(security, /Do not include[\s\S]*public GitHub[\s\S]*issue/i, "SECURITY.md must discourage public sensitive disclosure");

const expectedPrdCommands = [
  "promptsnap init",
  "promptsnap update ./skills ./prompts",
  "promptsnap check ./skills ./prompts",
  "promptsnap diff ./skills ./prompts --format markdown",
];
const commandBlock = prd.match(/## CLI\/API Sketch\s+```bash\n([\s\S]*?)\n```/);
assert(commandBlock, "docs/PRD.md must contain a bash CLI/API Sketch");
const documentedCommands = commandBlock[1].split("\n").map((line) => line.trim()).filter(Boolean);
assert.deepEqual(documentedCommands, expectedPrdCommands, "PRD CLI sketch must match the supported executable workflow");

const fixture = mkdtempSync(join(tmpdir(), "promptsnap-prd-"));
const cli = join(dirname(fileURLToPath(import.meta.url)), "../dist/cli.js");
try {
  mkdirSync(join(fixture, "skills"));
  for (const command of documentedCommands) {
    const args = command.split(/\s+/).slice(1);
    execFileSync(process.execPath, [cli, ...args], { cwd: fixture, stdio: "pipe" });
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log("Pre-release, security, and executable PRD guidance are ready.");
