import assert from "node:assert/strict";
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

test("unknown options fail instead of being treated as paths", () => {
  const result = capture(() => main(["check", "--frobnicate"], process.cwd()));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown option: --frobnicate/);
});
