import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const security = readFileSync(new URL("../SECURITY.md", import.meta.url), "utf8");

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

console.log("Pre-release installation and vulnerability reporting guidance are ready.");
