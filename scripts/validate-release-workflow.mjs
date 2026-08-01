import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const dryRun = readFileSync(new URL("../.github/workflows/release-dry-run.yml", import.meta.url), "utf8");

const tagCheck = workflow.indexOf('test "$GITHUB_REF_NAME" = "v$package_version"');
const releaseCheck = workflow.indexOf("npm run release:check");
const publish = workflow.indexOf("npm publish --provenance --access public");
const githubRelease = workflow.indexOf("gh release create");

assert(tagCheck >= 0, "release workflow must reject a tag that differs from package.json");
assert(releaseCheck > tagCheck, "release checks must run after tag validation");
assert(publish > releaseCheck, "npm publication must run after all release checks");
assert(githubRelease > publish, "GitHub release must be created only after npm publication");
assert.match(workflow, /id-token: write/, "npm provenance requires the OIDC permission");
assert.match(workflow, /registry-url: https:\/\/registry\.npmjs\.org/, "npm publication requires the public registry");
assert.match(dryRun, /npm publish --dry-run --provenance --access public/, "dry run must validate npm publication configuration");

console.log("Release workflow publishes the verified package before creating the GitHub release.");
