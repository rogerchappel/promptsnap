import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { main } from "../cli.js";

function capture(fn: () => number): { code: number; stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  try {
    return { code: fn(), stdout, stderr };
  } finally {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}

test("help exits successfully after a command", () => {
  const result = capture(() => main(["check", "--help"], process.cwd()));
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage:/);
  assert.equal(result.stderr, "");
});

test("top-level help exits successfully", () => {
  const result = capture(() => main(["--help"], process.cwd()));
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage:/);
  assert.equal(result.stderr, "");
});

test("top-level version prints the package version", () => {
  const result = capture(() => main(["--version"], process.cwd()));
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "0.1.0\n");
  assert.equal(result.stderr, "");
});

test("unknown options fail instead of being treated as paths", () => {
  const result = capture(() => main(["check", "--frobnicate"], process.cwd()));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown option: --frobnicate/);
});

test("check rejects init-only --force", () => {
  const result = capture(() => main(["check", "--force"], process.cwd()));
  assert.equal(result.code, 1);
  assert.equal(result.stderr, "Option --force is not valid for command check\n");
});

test("init rejects --format before writing files", () => {
  const root = mkdtempSync(join(tmpdir(), "promptsnap-cli-"));
  try {
    const result = capture(() => main(["init", "--format", "json"], root));
    assert.equal(result.code, 1);
    assert.equal(result.stderr, "Option --format is not valid for command init\n");
    assert.equal(existsSync(join(root, "promptsnap.config.json")), false);
    assert.equal(existsSync(join(root, "prompts")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
